const PENDING = "PENDING"; // 等待态
const RESOLVE = "RESOLVE"; // 成功态
const REJECT = "REJECT"; // 失败态

//处理返回成功态的结果
function resolvePromise(promise2, x, resolve, reject) {
  // 1、如果then返回的promise是自己，直接报错
  if (promise2 === x) {
    return reject(new TypeError('TypeError: Chaining cycle detected for promise #<Promise>'));
  }

  let called = false; // 防止在当前promise resolve又调用reject  reject又调用resolve
  // 2、判断x，当x为对象或Function时，x可能是一个promise
  if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
    try {
      let then = x.then; // then只拿一次，如果有人设置then的getter，多次取可能会报错
      if (typeof then === 'function') { // 就认为x是一个promise，那就执行then
        then.call(x, (y) => {
          if (called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject); // y可能又是个promise，递归y处理返回的promise
        }, (r) => {
          if (called) return;
          called = true;
          reject(r);
        })
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e)
    }
  } else {
    resolve(x)
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING; // 默认等待态
    this.value = undefined; // 成功的返回结果
    this.reason = undefined; // 失败返回的结果

    // 发布订阅多次then
    this.onResolveCbs = [];
    this.onRejectCbS = [];

    let resolve = (value) => {
      if (value instanceof Promise) {
        value.then(resolve, reject); // 递归解决resolve为一个promise的情况，直到为普通值为止
        return;
      }
      if (this.status = PENDING) {
        this.value = value;
        this.status = RESOLVE;
        this.onResolveCbs.forEach(fn => fn()); // 发布 异步返回成功结果
      }
    }

    let reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECT;
        this.onRejectCbS.forEach(fn => fn()); // 发布 异步返回失败结果
      }
    }

    try {
      executor(resolve, reject); // 执行new Promise里的回调，回调可能会有错误，需要reject捕获
    } catch (e) {
      reject(e);
    }

  }

  // Promise 的静态方法 all，所传promise都返回成功态数据，则走resolve，有一个失败就reject
  static all(promises) { // promises的成员为普通值或promise
    return new Promise((resolve, reject) => {
      let arr = [];
      let idx = 0; // 计数器，判断处理了几个promises
      let processData = (value, index) => {
        arr[index] = value;
        if (++idx === promises.length) {
          resolve(arr);
        }
      }
      for (let i = 0; i < promises.length; i++) {
        let currentValue = promises[i];
        if (currentValue instanceof Promise) { // 是否为Promise
          currentValue.then(res => {
            processData(res, i);
          }, reject); // 有一个出错all就会直接返回错误的推送reject
        } else {
          processData(currentValue, i);
        }
      }
    })
  }

  static resolve(value) {
    return new Promise((resolve, reject) => {
      resolve(value)
    })
  }

  static reject(value) { // reject接搜一个promise无意义，他不会等待异步完成在执行
    return new Promise((resolve, reject) => {
      reject(value)
    })
  }

  static race = function (promises) {
    return new Promise((resolve, reject) => {
      promises.forEach((promise, index) => {
        promise.then(resolve, reject);
      });
    });
  }

  finally = function (callback) {
    return this.then((value) => { // this指向上一个then返回的promise
      return Promise.resolve(callback()).then(() => {
        return value;
      });
    }, (err) => {
      return Promise.resolve(callback()).then(() => {
        throw err;
      });
    });
  }

  then(onfulilled, onrejected) { // 接受状态推送的结果 失败态 或 成功态 或 等待态

    // onfulilled | onrejected  用户定义的可能不是一个函数，只需要拿到上一个promise resolve | reject 的结果，然后往下扔
    onfulilled = typeof onfulilled === 'function' ? onfulilled : res => res;
    onrejected = typeof onrejected === 'function' ? onrejected : err => {
      throw err
    };

    // promise2链式调用then时返回的Promise
    // 若用户then返回的是个promise时，用户定义的promise会被我们拿到进行后续处理，返回给用户的是我们定义的新的promise2
    let promise2 = new Promise((resolve, reject) => { // resolve,reject用户链式调用定义的回调
      // then方法的回调执行可能是一个普通值或是一个Promise，当然也可能报错
      if (this.status === RESOLVE) {
        // promise2要传给resolvePromise方法，所以得在promise2 new完之后才能有promise，使用异步setTimeout
        setTimeout(() => {
          try {
            // x是onfulilled返回的成功态结果（普通值|Promise|throw new Error），可能会报错（new Error）
            let x = onfulilled(this.value);
            resolvePromise(promise2, x, resolve, reject); // 执行到这说明onfulilled执行未报错
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === REJECT) {
        setTimeout(() => {
          try {
            // 失败态的回调，返回的可能为普通值或Promise或错误
            let x = onrejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === PENDING) { // 为此状态时，当前Promise有异步操作 Promise.then是同步调用
        // 将成功和失败的回调都存到数组中 ， 订阅模式
        this.onResolveCbs.push(() => {
          setTimeout(() => {
            try {
              let x = onfulilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          })
        })
        this.onRejectCbS.push(() => {
          setTimeout(() => {
            try {
              let x = onrejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        })
      }
    })
    return promise2;
  }

  catch (onrejected) { // 就是一个then
    return this.then(null, onrejected);
  }

}

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  })
  return dfd;
}

module.exports = Promise;