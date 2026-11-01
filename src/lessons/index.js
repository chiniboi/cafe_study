import { TinLesson } from './tin.js';
import { FoldLesson } from './fold.js';
import { SliceLesson } from './slice.js';

// Each lesson's 3D apparatus: the key is n in content/lessons.js, the value is its DioramaLesson class.

export const APPARATUS = {
  1: TinLesson,
  2: FoldLesson,
  3: SliceLesson,
};
