// 负责解析指令/插值表达式
class Compiler {
	constructor (vm) {
		this.vm = vm
		this.el = vm.$el
		//编译模版
		this.compile(this.el)
	}
	// 编译模版
	// 处理文本节点和元素节点
	compile (el) {
		const nodes = el.childNodes
		Array.from(nodes).forEach(node => {
			//判断是文本节点还是元素节点
            if (this.isTextNode(node)) {
            	this.compileText(node)
            } else if (this.isElementNode(node)) {
		        // 处理元素节点
		        this.compileElement(node)
		    }
            if (node.childNodes && node.childNodes.length) {
            	// 如果当前节点中还有子节点，递归编译
            	this.compile(node)
            }
		})
	}
	// 判断是否是文本节点
	isTextNode (node) {
		return node.nodeType === 3
	}
	// 判断是否是属性节点
	isElementNode (node) {
	    return node.nodeType === 1
	}
	// 判断是否是以 v- 开头的指令
	isDirective (attrName) {
		return attrName.startsWith('v-')
	}
	isEventDirective (attrName) {
		const reg = /\w*on/
		return reg.test(attrName)
	}
	// 编译文本节点
	compileText (node) {
		const reg = /\{\{(.+)\}\}/
		//获取文本节点的内容
		const value = node.textContent
		if (reg.test(value)) {
			// 插值表达式中的值就是我们要的属性名称
			const key = RegExp.$1.trim()
			// 把插值表达式替换成具体的值
			node.textContent = value.replace(reg, this.vm[key])
			// 创建watcher对象，当数据改变更新视图
			new Watcher(this.vm, key, (newValue) => {
		        node.textContent = newValue
		    })
		}
	}
	// 编译属性节点
	compileElement (node) {
		// 遍历元素节点中的所有属性，找到指令
		Array.from(node.attributes).forEach(attr => {
			//获取元素属性的名称
			let attrName = attr.name
			//判断当前的属性名称是否是指令
			if (this.isDirective(attrName)) {
				// attrName 的形式 v-text t-model
				// 截取属性的名称，获取 text model
				attrName = attrName.substr(2)
				// 获取属性的名称，属性的名称就是我们数据对象的属性 v-text="name" ，获取的是name
				const key = attr.value
				if (this.isEventDirective(attrName)){
		            this.bindEvent.call(this, node, attrName, key)
		            return
		        }
				// 处理不同的指令
				this.update(node, key, attrName)
			}
		})
	}
	// 负责更新DOM
	// 创建watcher
	update (node, key, dir) {
		// node 节点，key 数据的属性名称，dir 指令的后半部分
		const updateFn = this[dir + 'Updater']
		updateFn && updateFn.call(this, node, this.vm[key], key)
	}
	// v-text 指令的更新方法
	textUpdater (node, value, key) {
		node.textContent = value
		new Watcher(this.vm, key, (newValue) => {
			node.textContent = newValue
		})
	}
	// v-model 指令的更新方法
	modelUpdater (node, value, key) {
		node.value = value
		new Watcher(this.vm, key, (value) => {
			node.value = value
		})
		// 监听视图的变化 双向绑定
		node.addEventListener('input', () => { 
			this.vm[key] = node.value
		})
	}
	htmlUpdater (node, value, key) {
		node.innerHTML = value
		new Watcher(this.vm, key, (newValue) => {
			node.innerHTML = newValue
		})
	}
	bindEvent (node, attrName, key) {
		let fnName = this.vm.$options.methods && this.vm.$options.methods[key]
		let e = attrName.substr(attrName.indexOf(':') + 1,)
		fnName && node.addEventListener(e, fnName, false)
	}
}