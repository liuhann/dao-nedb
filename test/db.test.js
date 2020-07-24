const test = require('ava'),
    DB = require('../src/nedb');

test.beforeEach(async t => {
    const db = new DB('./test/db');
    const coll = db.getCollection('test');

    await coll.clean();
    await coll.insert({
        _id: 'id1',
        planet: 'Mars',
        system: 'solar',
        inhabited: false,
        satellites: ['Phobos', 'Deimos']
    });
    await coll.insert({
        _id: 'id2',
        planet: 'Earth',
        system: 'solar',
        inhabited: true,
        humans: {
            genders: 2,
            eyes: true
        }
    });
    await coll.insert({
        _id: 'id3',
        planet: 'Jupiter',
        system: 'solar',
        inhabited: false
    });
    await coll.insert({
        _id: 'id4',
        planet: 'Omicron Persei 8',
        system: 'futurama',
        inhabited: true,
        humans: { genders: 7 }
    });
    await coll.insert({
        _id: 'id5',
        completeData: {
            planets: [{
                name: 'Earth',
                number: 3
            }, {
                name: 'Mars',
                number: 2
            }, {
                name: 'Pluton',
                number: 9
            }]
        }
    });

    t.context = {
        coll
    }
})
test.serial('init db and collection', async t => {
    const { coll } = t.context
    t.true(coll !== null);
});

test.serial('Insert and Find', async t => {
    const db = new DB('./test/db'),
        coll = db.getCollection('test'),

        inserted = await coll.insert({
            hello: 'Database',
            field: 1
        });

    t.is('Database', inserted.hello);

    t.false(inserted._id == null);

    const existed = await coll.exist({
        field: 1
    });

    t.is(true, existed);

    const foundOne = await coll.findOne(inserted._id);

    t.is(inserted._id, foundOne._id);
});

test.serial('Querying', async t => {
    const { coll } = t.context;


    // 基础条件查询、计数
    const solar = await coll.find({ system: 'solar' });
    t.is(3, solar.length);
    t.is(3, await coll.count({ system: 'solar' }));
    

    // 正则匹配 包含 /ar/
    t.is(2, (await coll.find({ planet: /ar/ })).length);

    // 多条件查询 Finding all inhabited planets in the solar system
    t.is(1, (await coll.find({ system: 'solar', inhabited: true })).length);

    // 对象类型字段的递归查询 
    t.is(1, (await coll.find({ "humans.genders": 2 })).length);

    // 支持的数组查询方式 按数组字段查询
    t.is(1, (await coll.find({ "completeData.planets.name": "Mars" })).length);

    t.is(0, (await coll.find({ "completeData.planets.name": "Jupiter" })).length);

    // 支持的数组查询方式 按下标查询
    t.is(1, (await coll.find({ "completeData.planets.0.name": "Earth" })).length);
    
    // 操作符 $in. $nin
    t.is(2, (await coll.find({ planet: { $in: ['Earth', 'Jupiter'] } })).length);

    // 按id的多个查找
    t.is(3, (await coll.find({ _id: { $in: ['id1', 'id2', 'id3'] } })).length);

    // $gt
    t.is(1, (await coll.find({ "humans.genders": { $gt: 5 } })).length);

    t.pass();
});


test.serial('Projection Sort and Limit', async t => {
    const { coll } = t.context;

    await coll.remove('id5');
    
    // 查询 按名称排序
    const result = await coll.find({}, {
        sort: {
            planet: 1
        },
        skip:1,
        limit: 2
    });

    t.is(2, result.length);

    t.is('Jupiter', result[0].planet);
    t.is('Mars', result[1].planet);

    // 查询投影
    const projectResult = await coll.find({ planet: 'Mars' }, {
        projection: {
            planet: 1, system: 1 
        }
    });
    
    t.is(1, projectResult.length)

    t.is('solar', projectResult[0].system)
    t.is('Mars', projectResult[0].planet)
    t.true(projectResult[0].satellites == null)
    t.pass()
})

test.serial('Update & Patch', async t => {

    const { coll } = t.context;
    
    // 替换一个文档
    await coll.update({ planet: 'Jupiter' }, { planet: 'Pluton'})

    let found = await coll.findOne('id3')

    t.is('Pluton', found.planet)
    t.true(found.system == null)

    // 更新字段
    t.is(2, (await coll.find({ system: 'solar' })).length)
    await coll.update({ system: 'solar' }, { $set: { system: 'solar system' } }, { multi: true })
    t.is(0, (await coll.find({ system: 'solar' })).length) 
    t.is(2, (await coll.find({ system: 'solar system' })).length) 

    // 删除字段
    await coll.update({ planet: 'Mars' }, { $unset: { planet: true } })
    t.true((await coll.findOne({ planet: 'Mars' })) == null)
    let unset = await coll.findOne('id1')
    t.true(unset.planet == null)
})


test.serial('Distinct', async t => {
    const { coll } = t.context;

    // 获取所有星球
    const dis = await coll.distinct('planet')
    t.is(4, dis.length)
    
    
    // 获取宜居的星球名称
    const qf = await coll.distinct('planet', {
        inhabited: true
    })
    t.is(2, qf.length)
})

test.serial('Remove', async t => {

    const { coll } = t.context;
    
    t.true((await coll.findOne('id1')) != null)
    // 单个删除
    await coll.remove('id1')
    t.true((await coll.findOne('id1')) == null)

    // 多个删除
    t.true((await coll.findOne('id2')) != null)
    await coll.remove(['id2', 'id3'])
    t.true((await coll.findOne('id2')) == null)
    t.true((await coll.findOne('id3')) == null)

    // 按条件删除
    t.true((await coll.findOne('id4')) != null)
    await coll.remove({system: 'futurama'})
    t.true((await coll.findOne('id4')) == null)

})