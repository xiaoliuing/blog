function bindActionCreator(actionCreator, dispatch) { // 处理actionCreator为函数的情况，返回一个函数
  return function(...args) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export default function bindActionCreators(actionCreators, dispatch) {
  // 兼容处理 actionCreators是函数就当做一个单一的action create
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  // 此处判断只允许对象通过
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('actionCreators必须是一个函数或对象');
  }

  const boundActionCreators = {} // 存储action
  /**
   {
     actionCreator: (...args) => dispatch(actionCreator.apply(this, args)),
     actionCreator: (...args) => dispatch(actionCreator.apply(this, args))
   }
   */
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}