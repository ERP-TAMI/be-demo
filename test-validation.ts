import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SaveProductionDocDto } from './src/features/production-docs/dto/save-production-doc.dto.js';

const payload = {
  "section1ImageUrl": "",
  "section2PhuLieu": "Test",
  "section3LuuYTraiCat": "Test",
  "section4CommentKhachHang": "Test",
  "sizeRows": [
    {
      "rowName": "test",
      "sValue": "1",
      "mValue": "2",
      "lValue": "3",
      "xlValue": "4",
      "patternValue": "5",
      "tolPlusMinus": "6",
      "orderIndex": 0
    }
  ],
  "sections": []
};

const instance = plainToInstance(SaveProductionDocDto, payload);
const errors = validateSync(instance);

console.log('Errors:', JSON.stringify(errors, null, 2));
