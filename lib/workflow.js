'use strict'

const BatchJob = require('./batch-job')
const BatchJobFactory = require('./batch-job-factory')
const pick = require('lodash.pick')

/**
 * Abstract base class for running simple workflows comprised of a sequence of
 * individual batch jobs.
 *
 * TODO: this should eventually be replaced by a more robust solution like
 * Apache Kafka.
 */
class Workflow extends BatchJob {
  static type = 'workflow'

  constructor(data, opts) {
    super(
      {
        type: Workflow.type,
        state: {
          jobIndex: 0
        },
        ...data
      },
      opts
    )

    const { pipeline } = this.params

    if (!pipeline) {
      throw new Error(
        `Workflow "${this.type}" missing required param "pipeline"`
      )
    }

    if (
      !Array.isArray(pipeline) ||
      pipeline.length < 2 ||
      !pipeline.every((job) => job.type) ||
      !pipeline
        .slice(1)
        .every((job) => job.connect && Object.keys(job.connect).length >= 1)
    ) {
      throw new Error(
        `Workflow "${this.type}" invalid value for param "pipeline"`
      )
    }
  }

  async _run() {
    const { pipeline, ...sharedParams } = this.params
    let { jobIndex = 0 } = this.state
    let job

    while (jobIndex < pipeline.length) {
      const jobConfig = pipeline[jobIndex]

      if (!jobConfig) {
        throw new Error(
          `Workflow "${this.type}" invalid current job ${jobIndex}`
        )
      }

      if (!this.state.pipeline) {
        this.state.pipeline = []
      }

      let jobData = this.state.pipeline[jobIndex]

      if (!jobData) {
        const connectParams = {}

        // connect the current job's params to the results of a previous job
        // in the pipeline
        if (jobIndex > 0 && jobConfig.connect) {
          for (const key of Object.keys(jobConfig.connect)) {
            const label = jobConfig.connect[key]
            let found = false

            for (let i = 0; i < jobIndex; ++i) {
              const pipelineJobConfig = pipeline[i]

              if (pipelineJobConfig.label === label) {
                const connectedJobData = this.state.pipeline[i]

                if (connectedJobData) {
                  connectParams[key] = connectedJobData.results

                  if (connectParams[key]) {
                    found = true
                  }
                }

                break
              }
            }

            if (!found) {
              throw new Error(
                `Workflow "${this.type}" invalid job ${jobIndex} unable to resolve connected data for "${key}" and label "${label}"`
              )
            }
          }
        }

        jobData = {
          type: jobConfig.type,
          transforms: jobConfig.transforms,
          params: {
            ...sharedParams,
            ...jobConfig.params,
            ...connectParams
          }
        }
      }

      console.log(this.type, '>>> new job', jobIndex, jobData)
      job = BatchJobFactory.deserialize(jobData, {
        db: this._context.db
      })

      if (job.status === 'done') {
        this.state.jobIndex = ++jobIndex
        await this.save()

        continue
      }

      await job.save()
      this.state.pipeline[jobIndex] = job.serialize()

      try {
        await job.run()
      } catch (err) {
        this.state.pipeline[jobIndex] = job.serialize()

        throw err
      }

      this.state.pipeline[jobIndex] = job.serialize()
      await this.save()

      if (job.status !== 'done') {
        return {
          status: job.status,
          state: this.state,
          error: job.error
        }
      }

      console.log(this.type, '<<< job', job.status, jobIndex, {
        ...pick(job, ['type', 'id']),
        results: job.results.length
      })

      this.state.jobIndex = ++jobIndex
      await this.save()
    }

    if (job) {
      return {
        results: job.results
      }
    }
  }
}

module.exports = Workflow
