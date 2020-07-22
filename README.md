# extend-dao-nedb

基于NeDB的文档型数据库存取控制

(https://github.com/louischatriot/nedb)

## nedb特点

1、纯JS开发，不需要依赖其他数据库
2、支持的语法多样，很多Mongodb的查询条件都可以支持
3、磁盘写入采取追加格式，数据增加时不会影响写入速度
4、运行时数据都在内存中，文档量大时需要内存支持。因此不适合十万级数据
5、支持索引，但同时也会影响写入性能

## 基本用法

```shell script
npm install wind-dao-nedb
```


```javascript
async (ctx, next) => {
    // 获取数据集合
    const coll = ctx.getCollection('test');
   
    // 插入数据
    const inserted = await coll.insert({
        hello: 1,
        name: 'Your name'
    });

    // 根据Id查找
    const one = await coll.findOne(inserted.id);
    
    // 列表查询
    const found = await coll.find({
        hello: 1
    });
}

```

## 基本概念

数据访问层定义了2个接口，Collection 和  Database， 二者功能和Mongodb概念类似， 体现的是文档型数据库的相关操作，开发使用接口对数据层进行存取，不必关心具体实现。
具体底层存储可能采取mongodb\pg\sqlite\lowdb\nedb等。 本模块内置的是nedb实现，不需要其他任何服务，数据存储在指定配置的文件夹下。

## 接口定义

Collection
```javascript
/**
 * 文档性数据集合接口
 */
class Collection {
    /**
   * 插入文档
   * 若插入的数据主键已经存在，则会抛 DuplicateKeyException 异常，提示主键重复，不保存当前数据。
   * @abstract
   * @param object
   * @return inserted 插入后的对象（含id）
   */
    async insert(object) {}

    /**
     * 更新文档内容
     * @param {Object} query 同find接口查询条件
     * @param {Object} update 更新内容
     * @param {Object} [options] 更新配置
     * @param {Object} [options.multi=false] 批量更新
     * @param {Object} [options.upsert=true] 更新插入
     */
    async update(id, object) {}

    /**
   * 更新已存在的文档局部
   * @abstract
   * @param id 文档标识
   * @param patched 文档要更新的字段集合
   */
    async patch(id, patched) {}

    /**
     * 删除文档, 删除条件可以为对象（删除满足条件的文档）、字符串(删除指定id的文档)、数组(按多个对象或字符串删除)
     * @abstract
     * @example
     * coll.remove(id)
     * coll.remove({query: 'abc'})
     * coll.remove([id1, id2, id3])
     * @param [Array|Object|String] query 查询标识
     */
    async remove(query) {}

    /**
   * 根据id获取一个文档
   * @abstract
   * @param id
   */
    async findOne(id) {}

    /**
   * 判断是否有指定查询条件的文档
   * @param query
   * @return {Promise<void>}
   */
    async exist(query) {}

    /**
     * 查询满足条件的文档列表
     * @abstract
     * @example
     * await testColl.find({})
     * testColl.find({}, { projection: { name: true } }
     * testColl.find({name: 'Tom'}, { projection: { name: false } }
     * testColl.find({group: 'tm'}, { projection: { name: false }, skip: 0, limit: 20 }
     * @param {Object} query 查询条件
     * @param {Object} sort 指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而 -1 是用于降序排列。
     * @param {Object} projection 可选，使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略）
     * @param {Number} skip 数字参数作为跳过的记录条数。 默认为 0
     * @param {Number} limit 数字参数，该参数指定从读取的记录条数。 默认为 -1 不限制
     * @return {
     *  list: [],
     *  skip: 0,
     *  limit: 10,
     *  total: 0
     * }
     */
    async find(query, {
        sort,
        projection,
        skip,
        limit
    }) {}

    /**
     * 按条件查询文档个数
     * @example
     * const count = await coll.count({}); // 3
     * @param {Object} query 查询条件
     */
    async count(query) {}

    /**
   * 清空数据库
   * @abstract
   * @return {Number} 删除的记录个数
   */
    async clean() {}
}

```

```javascript
class Database {
    /**
   * 获取集合
   * @param name
   */
    async getCollection(name) {}

    /**
   * 删除数据集合
   * @param name
   */
    async removeCollection(name) {}

    /**
   * 创建数据集合
   */
    async createCollection(name) {}
}
```

## 配置及对象获取


### 默认nedb配置参数

启动参数

```
{
  nedb: {
    store: './.nedb/' 
  }
}
```

### 获取数据库对象 

```javascript
    app.db  // 获取默认数据库 （保存到db.json）
    app.getDb('name') //获取指定数据库 (保存到name.json)
```

### 获取Coll对象

```javascript
  db.getCollection('coll')
```

## 操作API示例

### 插入、准备数据

```javascript
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
```

### 查询

```javascript
 // 基础条件查询、计数
const solar = await coll.find({ system: 'solar' });
t.is(3, solar.list.length);
t.is(3, await coll.count({ system: 'solar' }));


// 正则匹配 包含 /ar/
t.is(2, (await coll.find({ planet: /ar/ })).list.length);

// 多条件查询 Finding all inhabited planets in the solar system
t.is(1, (await coll.find({ system: 'solar', inhabited: true })).list.length);

// 对象类型字段的递归查询
t.is(1, (await coll.find({ "humans.genders": 2 })).list.length);

// 支持的数组查询方式 按数组字段查询
t.is(1, (await coll.find({ "completeData.planets.name": "Mars" })).list.length);

t.is(0, (await coll.find({ "completeData.planets.name": "Jupiter" })).list.length);

// 支持的数组查询方式 按下标查询
t.is(1, (await coll.find({ "completeData.planets.0.name": "Earth" })).list.length);

// 操作符 $in. $nin
t.is(2, (await coll.find({ planet: { $in: ['Earth', 'Jupiter'] } })).list.length);

// $gt
t.is(1, (await coll.find({ "humans.genders": { $gt: 5 } })).list.length);
```

### 排序、分页及投影

```javascript
await coll.remove('id5');

// 查询 按名称排序
const result = await coll.find({}, {
    sort: {
        planet: 1
    },
    skip:1,
    limit: 2
});

t.is(2, result.list.length);

t.is('Jupiter', result.list[0].planet);
t.is('Mars', result.list[1].planet);

// 查询投影
const projectResult = await coll.find({ planet: 'Mars' }, {
    projection: {
        planet: 1, system: 1 
    }
});

t.is(1, projectResult.list.length)

t.is('solar', projectResult.list[0].system)
t.is('Mars', projectResult.list[0].planet)
t.true(projectResult.list[0].satellites == null)

```

### 更新、替换

```javascript

// 替换一个文档
await coll.update({ planet: 'Jupiter' }, { planet: 'Pluton'})

let found = await coll.findOne('id3')

t.is('Pluton', found.planet)
t.true(found.system == null)

// 更新字段
t.is(2, (await coll.find({ system: 'solar' })).list.length)
await coll.update({ system: 'solar' }, { $set: { system: 'solar system' } }, { multi: true })
t.is(0, (await coll.find({ system: 'solar' })).list.length) 
t.is(2, (await coll.find({ system: 'solar system' })).list.length) 

// 删除字段
await coll.update({ planet: 'Mars' }, { $unset: { planet: true } })
t.true((await coll.findOne({ planet: 'Mars' })) == null)
let unset = await coll.findOne('id1')
t.true(unset.planet == null)

```

### 删除文档

```javascript
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
```

## 注意
