const { Collection } = require('wind-core-dao'),
    NeDataStore = require('nedb');

class NeCollection extends Collection {
    constructor(filename) {
        super();
        this.store = new NeDataStore({
            filename,
            timestampData: true,
            autoload: true
        });
    }

    /**
     * 插入文档
     * 若插入的数据主键已经存在，则会抛 DuplicateKeyException 异常，提示主键重复，不保存当前数据。
     * @override
     * @param object
     * @return inserted 插入后的对象（含id）
     */
    async insert(object) {
        return new Promise((resolve, reject) => {
            this.store.insert(object, function(err, newDoc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(newDoc);
                }
            });
        });
    }

    /**
     * 更新文档内容
     * @param {Object} query 同find接口查询条件
     * @param {Object} update 更新内容
     * @param {Object} [options] 更新配置
     * @param {Object} [options.multi=false] 批量更新
     * @param {Object} [options.upsert=true] 更新插入
     */
    async update(query, update, options) {
        return new Promise((resolve, reject) => {
            let q = query;

            if (typeof query === 'string') {
                q = {
                    _id: query
                };
            }
            this.store.update(q, update, options || {}, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * 等同于 update({ _id: id }, {
            $set: object
        });
     * @param {Object} id 同find接口查询条件
     * @param {Object} update 更新内容
     * @param {Object} [options] 更新配置
     * @param {Object} [options.multi=false] 批量更新
     * @param {Object} [options.upsert=true] 更新插入
     */
    async patch(id, object) {
        return this.update({ _id: id }, {
            $set: object
        });
    }

    /**
     * 清空数据库
     * @abstract
     * @return {Number} 删除的记录个数
     */
    async clean() {
        return new Promise((resolve, reject) => {
            this.store.remove({}, { multi: true }, function(err, numRemoved) {
                if (err) {
                    reject(err);
                } else {
                    resolve(numRemoved);
                }
            });
        });
    }

    /**
   * 删除一个文档
   * @override
   * @param id 文档标识/查询条件
   */
    async remove(id) {
        if (typeof id === 'object') {
            // 按查询条件删除
            if (Array.isArray(id)) {
                // 作为数组进行批量删除
                for (const arrayItem of id) {
                    await this.remove(arrayItem);
                }
            } else {
                await this.doRemove(id);
            }
        } else if (typeof id === 'string') {
            // 按id删除
            await this.doRemove({ _id: id });
        }
    }

    async doRemove(query, options) {
        return new Promise((resolve, reject) => {
            this.store.remove(query, options || { multi: true }, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
   * 根据id或条件获取一个文档
   * @verride
   * @param id 文档id或者文档的查询条件
   */
    async findOne(id) {
        if (typeof id === 'string') {
            return new Promise((resolve, reject) => {
                this.store.findOne({
                    _id: id
                }, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } else {
            const result = await this.find(id);

            if (result.length > 0) {
                return result[0];
            } else {
                return null;
            }
        }
    }

    /**
   * 查询满足条件的文档列表
   * @override
   * @param query 查询条件
   * @param sort 指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 1 为升序排列，而 -1 是用于降序排列。
   * @param projection 使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略） { field1: true, field2: true ... }
   * @param skip 数字参数作为跳过的记录条数。 默认为 0
   * @param limit 数字参数，该参数指定从读取的记录条数。 默认为 -1 不限制
   */
    async find(query, {
        sort,
        projection,
        skip = 0,
        limit = -1
    } = {}) {
        return new Promise((resolve, reject) => {
            let cursor = this.store.find(query);

            if (projection) {
                cursor = cursor.projection(projection);
            }

            if (sort) {
                cursor = cursor.sort(sort);
            }

            if (skip) {
                cursor = cursor.skip(skip);
            }
            if (limit > 0) {
                cursor = cursor.limit(limit);
            }

            cursor.exec(function(err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    async count(query) {
        return new Promise((resolve, reject) => {
            this.store.count(query, function(err, count) {
                if (err) {
                    reject(err);
                } else {
                    resolve(count);
                }
            });
        });
    }

    /**
   * 判断是否有指定查询条件的文档
   * @param query
   * @return {Promise<void>}
   */
    async exist(query) {
        const result = await this.find(query, {
            limit: 1
        });

        return result.length > 0;
    }
}

module.exports = NeCollection;
