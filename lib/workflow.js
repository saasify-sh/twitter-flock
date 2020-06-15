'use strict'

const BatchJob = require('./batch-job')
const BatchJobFactory = require('./batch-job-factory')

/**
 * Abstract base class for running simple workflows composed of a sequence of
 * individual batch jobs.
 *
 * TODO: this should eventually be replaced by a more robust solution like
 * Apache Kafka.
 */
class Workflow extends BatchJob {
  static type = 'workflow'

  constructor(data) {
    super({
      type: Workflow.type,
      state: {
        jobIndex: 0
      },
      ...data
    })

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
    const { pipeline, ...restParams } = this.params
    let { jobIndex = 0 } = this.state

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
          params: {
            ...restParams,
            ...jobConfig.params
          }
        }
      }

      const serializedJobData = JSON.stringify(jobData)
      const job = BatchJobFactory.deseralize(serializedJobData)
      this.state.pipeline[jobIndex] = JSON.parse(job.serialize())

      try {
        await job.run()
      } catch (err) {
        this.state.pipeline[jobIndex] = JSON.parse(job.serialize())

        throw err
      }

      this.state.pipeline[jobIndex] = JSON.parse(job.serialize())
      this.state.jobIndex = ++jobIndex
    }
  }
}

module.exports = Workflow
