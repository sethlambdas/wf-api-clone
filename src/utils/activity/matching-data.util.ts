import { Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { getMentionedData, resolveMentionDataFromMatchingData } from 'utils/helpers/string-helpers.util';

interface TwoThreeWayMatchingFunctionProps {
  arrayInput: string;
  primaryKeyField: string;
  fields: string[];
}

interface CompareLineItemsProps {
  last: any;
  fields: any[];
  firstLineItemElement: any;
  i: number;
  mismatch_data: any;
  primaryKeyField: any;
  mismatch: boolean;
  exist: boolean;
}

const logger = new Logger('matchingData');

export default async function matchingData(payload: any, state?: any) {
  logger.log('Matching Data Activity');
  const { ArrayInput, PrimaryKeyField: primaryKeyField, MatchingFields } = payload;
  try {
    const resolvedArrayInput: any = resolveMentionDataFromMatchingData(removeOuterBraces(ArrayInput), state);
    const arrayInput = convertArrayObjectToObjectString(resolvedArrayInput);
    const fields = JSON.parse(MatchingFields);
    const result = twoThreeWayMatchingFunction({ arrayInput, primaryKeyField, fields });
    return result;
  } catch (err) {
    logger.log('error', err);
  }
}

const twoThreeWayMatchingFunction = ({ arrayInput, primaryKeyField, fields }: TwoThreeWayMatchingFunctionProps) => {
  let result = {
    matched: {
      count: 0,
      idx: [],
    },
    mismatched: {
      count: 0,
      idx: [],
      data: [],
    },
  };
  try {
    const parsedArrayInput = JSON.parse(arrayInput);
    if (typeof parsedArrayInput === 'object') {
      const objectKeys = Object.keys(parsedArrayInput);
      const firstLineItem = parsedArrayInput[objectKeys[0]];
      const lastLineItem = parsedArrayInput[objectKeys[objectKeys.length - 1]];
      const midLineItem = objectKeys.length > 2 ? parsedArrayInput[objectKeys[1]] : [];
      let match_count = 0;
      let match_index = [];
      let mismatch_count = 0;
      let mismatch_index = [];
      let mismatch_data = [];
      for (let i = 0; i < firstLineItem.length; i++) {
        const firstLineItemElement = firstLineItem[i];
        let exist = false;
        let mismatch = false;
        // if 3 way matching
        if (midLineItem.length > 0) {
          midLineItem.map((mid, idx) => {
            const { _exist, _mismatch } = compareLineItems({
              last: mid,
              fields,
              exist,
              firstLineItemElement,
              i,
              mismatch,
              mismatch_data,
              primaryKeyField,
            });
            exist = _exist;
            mismatch = _mismatch;
          });
        }
        lastLineItem.map((last, idx) => {
          const { _exist, _mismatch } = compareLineItems({
            last,
            fields,
            firstLineItemElement,
            i,
            mismatch_data,
            primaryKeyField,
            mismatch,
            exist,
          });
          exist = _exist;
          mismatch = _mismatch;
        });
        if (mismatch) {
          mismatch_count = mismatch_count + 1;
          mismatch_index.push(i);
        } else {
          if (!exist) {
            mismatch_count = mismatch_count + 1;
            mismatch_index.push(i);
            mismatch_data.push({
              idx: i,
              key: primaryKeyField,
              value1: firstLineItemElement[`${primaryKeyField}`],
              msg: `${primaryKeyField}: ${firstLineItemElement[`${primaryKeyField}`]} does not exist on ${
                objectKeys[objectKeys.length - 1]
              }`,
            });
          } else {
            match_count = match_count + 1;
            match_index.push(i);
          }
        }
      }
      result = {
        matched: {
          count: match_count,
          idx: [...new Set(match_index)],
        },
        mismatched: {
          count: mismatch_count,
          idx: [...new Set(mismatch_index)],
          data: mismatch_data,
        },
      };
      logger.log('result', result);
      return { result: result };
    }
    return { result: result };
  } catch (error) {
    logger.log('Error', error);
    return { result: result };
  }
};

const removeOuterBraces = (str: string): string => {
  if (str.match(/{{{.*}}}/)) {
    return str.slice(1, -1);
  }
  return str;
};

const convertArrayObjectToObjectString = (arrayObject: string): string => {
  const parsedArrayObject = JSON.parse(arrayObject);
  let objectString = {};
  parsedArrayObject.map((arr) => {
    objectString = { ...objectString, ...arr };
  });
  return JSON.stringify(objectString);
};

const compareLineItems = ({
  last,
  fields,
  firstLineItemElement,
  i,
  mismatch_data,
  primaryKeyField,
  mismatch,
  exist,
}: CompareLineItemsProps) => {
  let _mismatch = mismatch;
  let _exist = exist;

  // if objects
  if (
    typeof last[`${primaryKeyField}`] === 'object' &&
    typeof firstLineItemElement[`${primaryKeyField}`] === 'object'
  ) {
    const equal = _.isEqual(last[`${primaryKeyField}`], firstLineItemElement[`${primaryKeyField}`]);
    if (equal) {
      for (let c = 0; c < fields.length; c++) {
        const element = fields[c];
        if (typeof firstLineItemElement[`${element}`] === 'object' && typeof last[`${element}`] === 'object') {
          const equal = _.isEqual(firstLineItemElement[`${element}`], last[`${element}`]);
          if (!equal) {
            mismatch_data.push({
              idx: i,
              key: element,
              value1: firstLineItemElement[`${element}`],
              value2: last[`${element}`],
              msg: `${element}: ${firstLineItemElement[`${element}`]} is not matching ${last[`${element}`]}`,
            });
            _mismatch = true;
          }
        } else {
          if (firstLineItemElement[`${element}`] !== last[`${element}`]) {
            mismatch_data.push({
              idx: i,
              key: element,
              value1: firstLineItemElement[`${element}`],
              value2: last[`${element}`],
              msg: `${element}: ${firstLineItemElement[`${element}`]} is not matching ${last[`${element}`]}`,
            });
            _mismatch = true;
          }
        }
      }
      _exist = true;
    }
  } else {
    // compare directly
    if (last[`${primaryKeyField}`] === firstLineItemElement[`${primaryKeyField}`]) {
      for (let c = 0; c < fields.length; c++) {
        const element = fields[c];
        if (typeof firstLineItemElement[`${element}`] === 'object' && typeof last[`${element}`] === 'object') {
          const equal = _.isEqual(firstLineItemElement[`${element}`], last[`${element}`]);
          if (!equal) {
            mismatch_data.push({
              idx: i,
              key: element,
              value1: firstLineItemElement[`${element}`],
              value2: last[`${element}`],
              msg: `${element}: ${firstLineItemElement[`${element}`]} is not matching ${last[`${element}`]}`,
            });
            _mismatch = true;
          }
        } else {
          if (firstLineItemElement[`${element}`] !== last[`${element}`]) {
            mismatch_data.push({
              idx: i,
              key: element,
              value1: firstLineItemElement[`${element}`],
              value2: last[`${element}`],
              msg: `${element}: ${firstLineItemElement[`${element}`]} is not matching ${last[`${element}`]}`,
            });
            _mismatch = true;
          }
        }
      }
      _exist = true;
    }
  }
  return { _mismatch, _exist };
};
