
const ActionName = Symbol('Action')

abstract class Action<P = unknown> {
	abstract [ActionName]: string
	payload?: P
}

namespace lib {
	export const capitalize = <S extends string>(string: S) => (string[0].toUpperCase() + string.slice(1)) as Capitalize<S>
}

type Maker<T, P extends any[] = []> = new (...args: P) => T

type ActionMaker<F extends (arg: any) => any> = Maker<Action<ReturnType<F>>, Parameters<F>>

type ActionMakers<A extends Record<string, (arg: any) => any>> = {
	[K in keyof A as Capitalize<Extract<K, string>>]: ActionMaker<A[K]>
}

const defineActions = <A extends Record<string, (arg: any) => any>>(base: string, actionSyntax: A): ActionMakers<A> => {
	class Base extends Action {
		[ActionName] = base
	}

	return Object.fromEntries(Object.entries(actionSyntax).map(([actionName, prepareAction]) => {
		const Name = lib.capitalize(actionName)

		const Class = class ActionMaker extends Base {
			constructor(arg: any) {
				super()
				this.payload = prepareAction(arg)
			}
			[ActionName] = `${base}/${Name}`
		}

		Object.defineProperty(Class, 'name', {
			value: `${Name}Action`
		})

		return [Name, Class]
	})) as ActionMakers<A>
}



const { ThingHappend } = defineActions('/yes', {
	thingHappend: (number: number) => ({
		times: number
	})
})

