// 合并所有reducer
// {
//   header: reducer,
//   home: reducer,
// }
const combineReducer = function(reducers) { 
  const reducerKeys = Object.keys(reducers); // 得到reducer数组
  return function newReducer(state={}, action) {
    let newState = {};
    for(let i = 0; i < reducerKeys.length; i++) {
      let key = reducerKeys[i]; // 拿到每个reducer的key
      let reducer = reducers[key]; // 拿到对应key的reducer

      const preState = state[key]; // 初始没实际意义

      const newStateForKey = reducer(preState, action); // 取得每个reducer的state

      newState[key] = newStateForKey; // 存储每个reducer的state，key为reducer的key
    }

    return newState;
  }
}

export default combineReducer;