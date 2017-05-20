const Koa = require('koa')
const app = new Koa()
const router = require('./router')
const bodyParser = require('koa-bodyparser')

app.use(bodyParser())
app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
