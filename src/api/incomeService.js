const express = require('express');
const monk = require('monk');
const Joi = require('@hapi/joi');
const { json } = require('express');


// const db = monk('localhost:27017')
const db = monk(process.env.MONGO_URI)

const mongoCollection = db.get('incomeCollection');

const schema = Joi.object({
    incomePlatform: Joi.string().trim().required(), // 收入平台 支付宝/微信/现金/银行卡
    orderNum: Joi.number().required(),
    remark: Joi.string().trim(),
    incomeCategry: Joi.string().trim().required(),
    incomeAmount: Joi.number().required(),
    createBy: Joi.string().required(),
    createDate: Joi.date().iso().required(),
    updateDate: Joi.date().iso(),
    updateBy: Joi.string()
});

const isoDate = () => {
    const nowDate = new Date();
    return nowDate.setHours(nowDate.getHours(), nowDate.getMinutes() - nowDate.getTimezoneOffset());
}

const router = express.Router();

// get all
router.get('/', async (req, res, next) => {
    try {
        // console.log(req, 'noted:::::::::::');
        const { pageIndex, pageSize } = req.query;
        console.log(pageIndex, pageSize, 'noted::::::::page');
        const skipNum = Number(pageIndex * pageSize);
        const items = await mongoCollection.find({}, {
            limit: Number(pageSize), // 限制一次查询条数
            skip: Number(skipNum) // 跳过多少条数据开始查询
        });
        res.json(items)
    } catch (error) {
        next(error)
    }
})

// get today Data
router.get('/today', async (req, res, next) => {
    try {
        const items = await mongoCollection.find(
            {
                createDate: { $gt: new Date('2020-10-18'), $lt: new Date('2020-10-19') }
            });
        res.json(items)
    } catch (error) {
        next(error)
    }
})


// get one
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await mongoCollection.findOne({
            _id: id,
        });
        console.log(item, 'noted:::::::');
        if (!item) return next({});
        return res.json(item);
    } catch (error) {
        next(error)
    }
})

// create one
router.post('/', async (req, res, next) => {
    try {
        console.log(req.body, 'noted::::::');
        const value = await schema.validateAsync(req.body);
        const inserted = await mongoCollection.insert(value);
        res.json(inserted);
    } catch (error) {
        next(error)
    }
})

// update one
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const value = await schema.validateAsync(req.body);
        const item = await mongoCollection.findOne({
            _id: id,
        });
        if (!item) return next();
        await mongoCollection.update({
            _id: id,
        }, {
            $set: value
        });
        res.json(value);
    } catch (error) {
        next(error)
    }
})

// delete one
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await mongoCollection.remove({ _id: id });
        res.json({
            message: 'delete Success'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router;
