'use strict'

const BatchJob = require('./batch-job')
const BatchJobFactory = require('./batch-job-factory')
const hasha = require('hasha')
const shortid = require('shortid')

/**
 * Abstract base class for running simple workflows comprised of a sequence of
 * individual batch jobs.
 *
 * TODO: this should eventually be replaced by a more robust solution like
 * Apache Kafka.
 */
class Workflow extends BatchJob {
  static type = 'workflow'

  static getPipelineHash = (pipeline) => {
    const input = pipeline.map((job) => job.type).join(',')
    return hasha(input, { encoding: 'hex', algorithm: 'md5' })
  }

  constructor(data, opts) {
    const { pipeline } = data.params

    if (!pipeline) {
      throw new Error(
        `Workflow "${data.type}" missing required param "pipeline"`
      )
    }

    const type = data.type || Workflow.type
    const id =
      data.id ||
      `${type}:${Workflow.getPipelineHash(pipeline)}:${shortid.generate()}`

    if (
      !Array.isArray(pipeline) ||
      pipeline.length < 2 ||
      !pipeline.every((job) => job.type) ||
      !pipeline
        .slice(1)
        .every((job) => job.connect && Object.keys(job.connect).length >= 1)
    ) {
      throw new Error(`Workflow "${id}" invalid value for param "pipeline"`)
    }

    super(
      {
        state: {
          jobIndex: 0
        },
        ...data,
        type,
        id
      },
      opts
    )
  }

  async _run() {
    const { pipeline, ...sharedParams } = this.params
    let { jobIndex = 0 } = this.state
    let job

    while (jobIndex < pipeline.length) {
      const jobConfig = pipeline[jobIndex]

      if (!jobConfig) {
        throw new Error(`Workflow "${this.id}" invalid current job ${jobIndex}`)
      }

      if (!this.state.pipeline) {
        this.state.pipeline = []
      }

      const jobId = this.state.pipeline[jobIndex]
      let jobData

      if (jobId) {
        jobData = await this._context.db.get(jobId)
      } else {
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
                const connectedJobId = this.state.pipeline[i]
                const connectedJobData = await this._context.db.get(
                  connectedJobId
                )

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
                `Workflow "${this.id}" invalid job ${jobIndex} unable to resolve connected data for "${key}" and label "${label}"`
              )
            }
          }
        }

        jobData = {
          type: jobConfig.type,
          params: {
            ...sharedParams,
            ...jobConfig.params,
            ...connectParams
          }
        }
      }

      job = BatchJobFactory.deserialize(jobData, this._context)

      if (job.status === 'active') {
        if (!jobId) {
          this.state.pipeline[jobIndex] = job.id
          await job.save()
          await this._update()
        }

        this._logger.debug('>>>', this.id, 'job', {
          jobIndex,
          id: job.id,
          status: job.status,
          results: job.results.length
        })

        await job.run()

        this._logger.debug('<<<', this.id, 'job', {
          jobIndex,
          id: job.id,
          status: job.status,
          results: job.results.length
        })
        this._logger.debug()
      }

      if (job.status === 'done') {
        this.state.jobIndex = ++jobIndex
        await this._update()
      } else {
        return {
          status: job.status,
          error: job.error
        }
      }
    }

    if (job) {
      return {
        results: job.results
      }
    }
  }
}

module.exports = Workflow
