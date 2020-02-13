
const initialState = {
  count: 1
}

const reducers = (state, action) => {
  switch(action.type) {
    case "ADD":
      return {...state, count: state.count + 1 }
    default:
      return state;
  }
}

const createStore = function(reducer, initialState, reWriteCreateStore) {
  if(typeof initialState === 'function') {
    reWriteCreateStore = initialState;
    initialState = null;
  }

  if(typeof reWriteCreateStore === 'function') {
    const newCreateStore = reWriteCreateStore(createStore);
    return newCreateStore(reducer, initialState);
  }
  let state = initialState; // 初始state
  let listeners = [];  // 订阅者

  function subscribe(listener) {
    listeners.push(listener);
    // 取消订阅
    return () => {
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    }
  }

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action); // 
    for(let listener of listeners) {
      listener();
    }
  }

  return { subscribe, getState, dispatch };
}

const { subscribe, getState, dispatch } = createStore(reducers, initialState);
subscribe(() => {
  console.log('订阅者：我拿到了state的变化' + getState().count)
})

dispatch({
  type: 'ADD'
})

dispatch({
  type: 'ADD'
})

dispatch({
  type: 'ADD'
})