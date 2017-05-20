const Router = require('koa-router')
const router = new Router()
const user = require('./controller/user')

router.post('/user/login', user.login)
router.get('/user/profile', user.profile)

module.exports = router
