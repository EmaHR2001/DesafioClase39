
const Cart = require('../dao/mongo/models/cart.model')
const { CustomError } = require('../services/errors/customErrors')
const { Errors } = require('../services/errors/enums')
const { idProductCartError, getCartError } = require('../services/errors/info')
const logger = require('../config/logger.config');

const CartService = require('../dao/mongo/services/cart.services')
const cartService = new CartService()
const UserService = require('../dao/mongo/services/users.services')
const userService = new UserService()
const ProductService = require('../dao/mongo/services/products.services')
const productService = new ProductService()


const getCart = (req, res) => {
    cartService.getCarts()
        .then(pr => {
            res.status(200).send(
                {
                    status: 'success',
                    msg: 'cart Find',
                    data: pr
                }
            )
        })
        .catch(err => {
            res.status(500).send(
                logger.error('Error loading product')
            )
        })
}
const postCart = (req, res) => {
    let data = req.body
    cartService.postCart(data)
        .then(pr => {
            res.status(201).send({
                msg: 'Cart create successfully',
                data: data
            })
        })
        .catch(err => {
            res.status(500).send(
                logger.error('Error create Cart')
            )
        })
}
const getCartById = (req, res) => {
    const cId = req.params.cId
    cartService.getCartById(cId)
        .then(pr => {
            res.status(200).send(
                {
                    status: 'success',
                    msg: 'cart Find',
                    data: pr
                }
            )
        })
        .catch(err => {
            res.status(500).send(
                logger.info('Error get Cart')
            )
        })
}
const postCartProductsById = (req, res) => {
    const cId = req.params.cId
    const pId = req.params.pId
    cartService.getCartById(cId)
        .then(pr => {
            let arr = pr.products
            let prIndex = arr.findIndex(pr => pr.product._id.toString() === pId)
            if (prIndex != -1) {
                arr[prIndex].quantity++
                let prodnew = []
                for (let prop of arr) {
                    prodnew.push({ product: prop.product._id.toString(), quantity: prop.quantity })
                }
                pr.products = prodnew
                cartService.updateCart(cId, pr)
                    .then(pr => {
                        res.status(200).send(
                            {
                                status: 'success',
                                msg: 'Product added to cart',
                                data: pr
                            }
                        )
                    })
                    .catch(err => {
                        const error = CustomError.createError({
                            name: 'Error al actualizar carrito',
                            cause: idProductCartError,
                            message: 'Error al intentar actualizar el carrito',
                            code: Errors.ADD_PRODUCT_ERROR
                        });
                        res.status(500).send({
                            status: 'error',
                            msg: error.name,
                            cause: error.cause
                        })
                    })
            }
            else {
                pr.products.push({ product: pId, quantity: 1 })
                cartService.updateCart(cId, pr)
                    .then(pr => {
                        res.status(200).send(
                            {
                                status: 'success',
                                msg: 'Product added to cart',
                                data: pr
                            }
                        )
                    })
                    .catch(err => {
                        const error = CustomError.createError({
                            name: 'Error al actualizar carrito',
                            cause: idProductCartError,
                            message: 'Error al intentar actualizar el carrito',
                            code: Errors.ADD_PRODUCT_ERROR
                        });
                        res.status(500).send({
                            status: 'error',
                            msg: error.name,
                            cause: error.cause
                        });
                    })
            }
        })
        .catch(err => {
            const error = CustomError.createError({
                name: 'Error al obtener carrito',
                cause: getCartError,
                message: 'Error al intentar obtener el carrito',
                code: Errors.CART_GET_ERROR
            });
            res.status(500).send({
                status: 'error',
                msg: error.name,
                cause: error.cause
            });
        })
}
const delCartById = async (req, res) => {
    let cId = req.params.cId
    cartService.delProductsCart(cId)
        .then(pr => {
            res.status(200).send(
                {
                    status: 'success',
                    msg: 'Empty cart products',
                    data: pr
                }
            )
        })
        .catch(err => {
            const error = CustomError.createError({
                name: 'Error al obtener carrito.',
                cause: getCartError,
                message: 'Error al buscar carrito.',
                code: Errors.EMPTY_CART_ERROR
            });
            res.status(500).send(
                logger.info('Carrito no encontrado.')
            )
        })
}
const delCartProductById = (req, res) => {
    const cId = req.params.cId
    const pId = req.params.pId
    cartService.getCartById(cId)
        .then(pr => {
            let arr = pr.products
            let prIndex = arr.findIndex(pr => pr.product._id.toString() === pId)
            if (prIndex != -1) {
                if (arr[prIndex].quantity <= 1) {
                    arr.splice(prIndex, 1)
                    let data = []
                    for (let prop of arr) {
                        data.push({ product: prop.product._id.toString(), quantity: prop.quantity })
                    }
                    pr.products = data
                    cartService.updateCart(cId, pr)
                        .then(pr => {
                            res.status(200).send(
                                {
                                    status: 'success',
                                    msg: 'Product Delete to cart',
                                    data: data
                                }
                            )
                        })
                        .catch(err => {
                            res.status(500).send({
                                status: 'error',
                                msg: 'something went wrong :(',
                                data: {}
                            })
                        })
                }
                else {
                    arr[prIndex].quantity -= 1
                    pr.products = arr
                    cartService.updateCart(cId, pr)
                        .then(pr => {
                            res.status(200).send(
                                {
                                    status: 'success',
                                    msg: 'Product Delete to cart',
                                    data: arr
                                }
                            )
                        })
                        .catch(err => {
                            res.status(500).send({
                                status: 'error',
                                msg: 'something went wrong :(',
                                data: {},
                            })
                        })
                }

            }
            else {
                res.status(200).send(
                    {
                        status: 'success',
                        msg: 'Product not found or dont exist',
                        data: pr
                    }
                )
            }
        })
        .catch(err => {
            res.status(500).send({
                status: 'error',
                msg: 'something went wrong :(',
                data: {},
            })
        })
}
const putCartById = (req, res) => {
    let cId = req.params.cId
    let data = req.body
    Cart.findOne({ _id: cId })
        .then(pr => {
            let arr = data
            pr.products = arr
            Cart.updateOne({ _id: cId }, pr)
                .then(pr => {
                    res.status(200).send(
                        {
                            status: 'success',
                            msg: 'Products update',
                            data: pr
                        }
                    )
                })
                .catch(err => {
                    res.status(500).send({
                        status: 'error',
                        msg: 'something went wrong :(',
                        data: {},
                    })
                })
        })
        .catch(err => {
            res.status(500).send({
                status: 'error',
                msg: 'something went wrong :(',
                data: {},
            })
        })
}
const putCartProductsById = (req, res) => {
    let cId = req.params.cId
    let pId = req.params.pId
    let { data } = req.body
    Cart.findOne({ _id: cId })
        .then(pr => {
            let arr = pr.products
            let prIndex = arr.findIndex(pr => pr.product._id.toString() === pId)
            if (prIndex != -1) {
                arr[prIndex].quantity = parseInt(data)
                let prodnew = []
                for (let prop of arr) {
                    prodnew.push({ product: prop.product._id.toString(), quantity: prop.quantity })
                }
                pr.products = prodnew
                Cart.updateOne({ _id: cId }, pr)
                    .then(pr => {
                        res.status(200).send(
                            {
                                status: 'success',
                                msg: 'Product quantity update',
                                data: pr
                            }
                        )
                    })
                    .catch(err => {
                        res.status(500).send({
                            status: 'error',
                            msg: 'something went wrong :(',
                            data: {},
                        })
                    })
            }
            else {
                res.status(200).send(
                    {
                        status: 'success',
                        msg: 'Product not found or dont exist',
                        data: pr
                    }
                )
            }
        })
        .catch(err => {
            res.status(500).send({
                status: 'error',
                msg: 'something went wrong :(',
                data: {},
            })
        })
}

const getCartErrorRender = (req, res) => {
    res.render('error404', {
        style: 'error404.css',
        title: 'Error 404'
    })
}




module.exports = {
    getCart,
    postCart,
    getCartById,
    postCartProductsById,
    delCartById,
    delCartProductById,
    putCartById,
    putCartProductsById,
    getCartErrorRender
}