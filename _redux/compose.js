export default function componse(...funcs) { // 函数组合  即实现  a(b(c(...arg)))
  if(funcs.length === 0) {
    return arg => arg;
  }

  if(funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...arg) => a(b(...arg)));
}
