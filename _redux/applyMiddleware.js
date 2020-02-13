import compose from './componse';
// redux中间件就是对dispatch进行重写
function applyMiddleWare(...middlewares) {
  return function reWriteCreateStoreFunc(oldCreateStore) {
    return function newCreateStore(reducer, initialState) {
      const store = oldCreateStore(reducer, initialState); // 执行原先的createStore
      let { getState, dispatch } = store;

      const chain = middlewares.map((middleware) => {
        middleware({getState, dispatch}); // 给每个middleware增加访问store的能力
      })

      dispatch = compose(...chain)(dispatch); // dispatch就是上一个middleware改写dispatch后的函数、

      return {...store, dispatch}
    }
  }
}

export default applyMiddleWare;