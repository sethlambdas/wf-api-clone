import * as config from 'config';
import * as _ from 'lodash';

export class ConfigUtil {
  static get(name: string) {
    const envName = _.chain(name).snakeCase().toUpper().value();
    return process.env[envName] || config.get(name);
  }
}
