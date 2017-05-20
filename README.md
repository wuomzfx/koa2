# 从零搭建Koa2 Server
前几天想写个小爬虫程序，准备后端就用koa2。于是翻遍github与各大网站，都没找到一个好用的、轻一点的koa2脚手架，也找不到一个清晰些的搭建介绍。github上的脚手架要么是1.x版的koa，要么一堆复杂的依赖。

当然可能还是有写的比较好的吧，只是我没找到。不管怎样吧，我只能亲自上了，就当是学习了。

现在把搭建过程介绍下，看能不能方便下入门的同学。

## 第一步：初始项目，引入 [Koa2](https://github.com/koajs/koa)
官方的介绍，是很简单的。

```javascript
$ npm install koa
```
```javascript
const Koa = require('koa')
const app = new Koa()

// response
app.use(ctx => {
  ctx.body = 'Hello Koa'
})

app.listen(3000)
```
好，那我们就先从这开始。创建一个文件夹，命名koa2。（记得先装好node v7.6.0 以上版本）
```bash
cd koa2

npm init // 一路回车，根据提示输入信息。

npm install koa --save
```
然后在文件下根目录下创建程序入口文件：index.js，并把官网介绍那段代码贴进去。之后在命令行中执行
```bash
node index.js
```
打开浏览器，访问 `http://localhost:3000/` ，可以看到页面输出了 `hello world`。

很好，第一步已经踏出去了。相信到这里大部分小白都没问题，之后就开始懵逼了。就这个玩意，我该怎么写接口？怎么连接数据库？

## 第二步：搭建路由与Controller

Koa本质上是调用一系列的中间件，来处理对应的请求，并决定是否传递到下一个中间件去处理。我们来写一个最简单的中间件试试。
``` javascript
// 刚才index.js 中的这段代码，我们改写一下。
app.use(ctx => {
  ctx.body = 'Hello Koa'
})

// 改成如下

app.use(ctx => {
  ctx.body = `您的网址路径为:${ctx.request.url}`
})
```
这段代码中，`app.use` 的 `function` 就是最简单的一个中间件，接受了请求，读出请求路径，并返回到客户端。重新执行下`node index.js`，打开浏览器，输入`http://localhost:3000/hhhhh`，页面输出了`您的网址路径为:hhhhh`。

所以，接口的本质，就是判断不同的请求链接，干不同的事情，返回相应的结果。那么我们得需要一个路由中间件来处理分发请求。开源的时代，当然是拿来主义了。github搜下[koa-router](https://github.com/alexmingoia/koa-router)，成功找到。根据它的介绍，我们先在项目根目录执行
```bash
npm install koa-router --save
```
然后把`index.js`文件再改造下。变成如下：

``` javascript
const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()
const router = new Router()

// 先注释了，后面再解释
// const bodyParser = require('koa-bodyparser')
// app.use(bodyParser())

router.get('/', ctx => {
  ctx.body = `这是主页`
})

router.get('/user', ctx => {
  ctx.body = `这是user页`
})

router.get('/post', ctx => {
  ctx.body = ctx.request.body
})

router.get('/async', async ctx => {
  const sleep = async (ms) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true)
      }, ms)
    })
  }
  await sleep(1000)
  ctx.body = `这是异步处理页`
})

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
```
重新执行 `node index.js`。我们可以看到访问 `/`, `/user`，`/async`，都能得到相应的结果了。

除了那个post的方法，压根得不到自己post的数据。

因为koa是很纯粹的，你提交的数据，它并不会帮你处理。所以这里我们又必须引用一个中间件来处理提交的数据--[bodyparser](https://github.com/koajs/bodyparser)。把上面那两行注释代码解注，就能处理请求数据了。记得要先
``` bash
npm install koa-bodyparser --save
```
另外关于`async/await`不明白的同学，可以先去看下阮老师的介绍，点击[传送门](http://es6.ruanyifeng.com/#docs/async)。

不过我们不能把所有的接口都写在这一个文件呀，所以我们得改造下。理一下思路，路由的配置文件应该单独一份，接口的方法应该按业务模块分成一个个controller。说干就干！

先看改造后的目录结构，不想截图，大家将就看看：
```
-koa2
  -node_modules
  -controller
    user.js
  -index.js
  -router.js
  -package.json
```
再来看文件变成怎么样了。
``` javascript
// index.js

const Koa = require('koa')
const app = new Koa()
const router = require('./router')
const bodyParser = require('koa-bodyparser')

app.use(bodyParser())

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)
```
``` javascript
// router.js

const Router = require('koa-router')
const router = new Router()
const user = require('./controller/user')

router.post('/user/login', user.login)
router.get('/user/profile', user.profile)

module.exports = router
```
``` javascript
// controller/user.js

const sleep = async (ms) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, ms)
  })
}
module.exports = {
  login (ctx) {
    ctx.body = {
      username: ctx.request.body.username
    }
  },
  async profile (ctx) {
    await sleep(1000)
    ctx.body = {
      username: '相学长',
      sex: 'man',
      age: '999'
    }
  }
}
```
再重新执行 `node index.js`。访问相应路由，应该能得到对应的结果了。

## 其他工程化配置
好，到此为止，我们的server已经大致完成了，但是我们发现一个很烦的问题就是，每次修改代码都得重新`node index.js`，这也太烦了。我希望的是，每次更新代码都能重新执行，并且帮我执行ESlint。其他前端项目webpack那一套，不是webpack配置工程师的话，自己挪过来又改不来。

这里我介绍个简单的方案，`nodemon + gulp`。具体呢就不一步步来了，这种东西，不用太了解，能run起来满足自己需求就好。如果不需要eslint的话，只要安装[nodemon](https://github.com/remy/nodemon)就好。

package.json scripts部分 修改为：
``` javascript
"scripts": {
  "nodemon": "nodemon index.js"
}
```
然后命令行执行：
``` bash
npm install nodemon --save-dev

npm run nodemon
```

如果有eslint的需求的话，就稍微麻烦些了，eslint的init我就不贴教程了，我贴上我的gulp配置文件：
``` javascript
// gulpfile.js
const gulp = require('gulp')
const lint = require('gulp-eslint')
const nodemon = require('gulp-nodemon')

function lintFiles (files) {
  return gulp.src(files)
    .pipe(lint())
    .pipe(lint.format())
    // .pipe(lint.failAfterError())
}

gulp.task('eslint', () => lintFiles(['**/*.js', '!node_modules/**']))

gulp.task('eslint_nodemon', ['eslint'], () => {
  return nodemon({
    script: './app/server.js', // 项目入口文件
    tasks (changedFiles) {
      lintFiles(changedFiles)
      return []
    },
    ignore: ['build/**', 'dist/**', '.git', 'node_modules/**']
  })
})

gulp.task('default', ['eslint_nodemon'])

```
``` javascript
// package.json scripts
"scripts": {
  "start": "pm2 start index.js --watch", // 这里用pm2 作为线上run，有兴趣的同学可以自己去看看
  "dev": "gulp",
  "lint": "eslint .",
  "fix": "eslint --fix ."
},
``` 

## 写在最后
到这里，我想应该能让一部分同学上手了。

但这只是初步的搭建了下koa。真的想投入使用，根据业务需求，可能还需要安装数据库驱动等中间件。对于复杂业务场景的server，还需要更加合理的设计controller，service，在这里就不多阐述了。

如果这篇文章，能够帮助到一些同学，下次有空再写写这方面相关的。
