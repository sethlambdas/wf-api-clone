import { Logger } from '@nestjs/common';
import fetch from 'node-fetch';

const logger = new Logger('webService');

export default async function webService(payload: any, state?: any) {
  logger.log('Web Service Activity');
  try {
    const { Endpoint, Name, Body, WLFN } = payload;

    if (!Endpoint) {
      logger.error('No http/s endpoint specified.');
      throw new Error();
    }

    if (!Name) {
      logger.error('No variable name specified.');
      throw new Error();
    }

    const resolvedBody = resolvedFieldsFromBody(WLFN, Body, state)

    const fetchOptions = {
      method: payload.Method,
      headers: {
        'Content-Type': 'application/json'
      },
    }

    if (Body) fetchOptions['body'] = resolvedBody;

    const apiResult = await fetch(payload.Endpoint, fetchOptions);

    const data = await apiResult.json();
    return { [`${payload.Name}`]: data };
  } catch (err) {
    logger.log('ERROR OCCURED:');
    logger.log(err);
    return 'ERROR OCCURRED!!!!';
  }
}

const resolvedFieldsFromBody = (WLFN: string, Body: string, state: any) => {
  if (!Body) return '';

  const { data } = state;

  const bodyObject = JSON.parse(Body);

  Object.keys(bodyObject).forEach((key: string) => {
    const regexBrackets = new RegExp(/{{(.*?)}}/gm);

    const match = regexBrackets.exec(bodyObject[key]);

    if (!match) return;

    const { 1: word } = match;
    const trimWord = word.trim();

    let workflowNameArr = WLFN.split(' ');
    workflowNameArr = workflowNameArr.filter((value) => {
      return value !== '' ? true : false;
    })
    const workflowName = workflowNameArr.join('_');

    if (word === `${workflowName}.payload`)
      bodyObject[key] = { ...data };
    else {
      let fields: string[];
      let dataValue: any;

      if (word.includes(`${workflowName}.payload`)) {
        fields = trimWord.split('payload.')[1].split('.');
        dataValue = { ...data };
      }
      else {
        fields = trimWord.split('.');
        dataValue = { ...state };
        delete dataValue.data;
      }

      let bodyObjectValue: any;

      fields.forEach((fieldName) => {
        bodyObjectValue = dataValue[fieldName];
        dataValue = dataValue[fieldName];
      });

      bodyObject[key] = bodyObjectValue;
    }
  });
  
  logger.log('RESOLVED BODY');
  logger.log(bodyObject);

  return bodyObject;
}