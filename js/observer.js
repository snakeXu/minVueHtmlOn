// 负责数据劫持 
// 把 $data 中的成员转换成 getter/setter
class Observer {
	constructor (data) {
		this.walk(data)
	}
	// 1.判断数据是否是对象，如果不是对象返回
	// 2.如果是对象，遍历对象的所有属性，设置为getter/setter
	walk (data) {
		if (!data || typeof data !== 'object') {
			return 
		}
		//遍历data所有成员
		Object.keys(data).forEach(key => {
			this.defineReactive(data, key, data[key])
		})
	}
	//定义响应式成员
	defineReactive (data, key, val) {
		const that = this 
		// 创建 dep 对象收集依赖 
		let dep = new Dep()
		// 如果val是对象，继续设置它下面的成员为响应式数据
		this.walk(val)
		Object.defineProperty(data, key, {
			configurable: true,
			enumerable: true,
			get () {
				// get 的过程中收集依赖
				Dep.target && dep.addSub(Dep.target)
				return val
			},
			set (newValue) {
				if (newValue === val) {
					return 
				}
				// 如果newValue是对象，设置newValue的成员为响应式
				that.walk(newValue)
				val = newValue
				// 当数据变化之后，发送通知 
				dep.notify()
			}
		})
	}
}