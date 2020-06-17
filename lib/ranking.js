'use strict'

// TODO: Serialization mechanism to pass data objects.
// Options:
// - List of user id's in stdout
// - JSON in stdout
// - JSON in output file
// - SQLite database

const spawn = require('child_process').spawn
const pythonProcess = spawn('python3', ['ranking/rank.py'])

pythonProcess.stdout.on('data', (data) => {
  // Do something with the data returned from python script
  console.log('received data from python stdout')
  console.log(data.toString())
})

pythonProcess.stderr.on('data', (data) => {
  // Do something with the data returned from python script
  console.log('received data from python stderr')
  console.log(data.toString())
})
