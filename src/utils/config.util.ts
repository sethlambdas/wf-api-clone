import * as config from 'config';
import * as _ from 'lodash';

export class ConfigUtil {
  static get(name: string) {
    const envName = _.chain(name).snakeCase().toUpper().value();

    if (process.env[envName]) {
      if (_.last(process.env[envName]) === ']' && _.head(process.env[envName]) === '[') {
        try {
          return JSON.parse(process.env[envName]);
        } catch (err) {
          return process.env[envName] || config.get(name);
        }
      }
    }
    return process.env[envName] || config.get(name);
  }
}
