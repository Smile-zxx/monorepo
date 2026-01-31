class Fiber {
    type: string
    child: Fiber | null
    sibling: Fiber | null
    parent: Fiber | null
    constructor(type: string) {
        this.type = type
        this.child = null
        this.sibling = null
        this.parent = null
    }
}

const performUnitOfWork = (fiber: Fiber) => {
    console.log(fiber.type)
    if (fiber.child) {
        return fiber.child
    }


    let next: Fiber | null = fiber
    while (next) {
        if (next.sibling) {
            return next.sibling
        }
        next = next.parent
    }
}

let root = new Fiber("root")
// let c11 = new Fiber("c11")
// let c12 = new Fiber("c12")
// let c21 = new Fiber("c21")
// let c22 = new Fiber("c22")
// let c31 = new Fiber("c31")

// root.child = c11
// c11.parent = root
// c11.sibling = c12
// c12.parent = root
// c12.sibling = c21
// c21.parent = root
// c21.sibling = c22
// c22.parent = root
// c22.sibling = c31

let current: Fiber | undefined = root
while (current) {
    current = performUnitOfWork(current)
}