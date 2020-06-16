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

  constructor(data, workflowPersistence = undefined) {
    super({
      type: Workflow.type,
      state: Workflow.getPersistedState(workflowPersistence) || {
        jobIndex: 0
      },
      ...data
    })

    const { pipeline } = this.params
    this.workflowPersistence = workflowPersistence

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
    let jobIndex = this.state.jobIndex
    let job

    while (jobIndex < pipeline.length) {
      const jobConfig = pipeline[jobIndex]

      if (!jobConfig) {
        throw new Error(
          `Workflow "${this.type}" invalid current job ${jobIndex}`
        )
      }

      if (!this.state.pipeline) {
        console.log('Workflow starting from scratch')
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
      const serializedJobData = JSON.stringify(jobData)
      job = BatchJobFactory.deserialize(serializedJobData)
      this.state.pipeline[jobIndex] = JSON.parse(job.serialize())

      try {
        await job.run()
      } catch (err) {
        this.state.pipeline[jobIndex] = JSON.parse(job.serialize())

        throw err
      }

      this.state.pipeline[jobIndex] = JSON.parse(job.serialize())

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

      if (jobConfig.saveOnSuccess && this.workflowPersistence) {
        this.workflowPersistence.save({
          state: this.state,
          pipeline: this.state.pipeline
        })
      }
    }

    if (job) {
      return {
        results: job.results
      }
    }
  }

  static getPersistedState(workflowPersistence) {
    const loadPersistedState = () => {
      try {
        const data = workflowPersistence.load()
        return { state: data.state, pipeline: data.pipeline }
      } catch (e) {
        return undefined
      }
    }

    if (!workflowPersistence) return undefined
    const persisted = loadPersistedState()
    return persisted ? persisted.state : undefined
  }
}

module.exports = Workflow
