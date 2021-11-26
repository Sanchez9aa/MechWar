const express = require('express')
const getProtocol = require('../protocols/utils')

const router = express.Router()

router.post("/", getProtocol, (req, res) => {

})


module.exports = router