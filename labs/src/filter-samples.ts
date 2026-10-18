import type { FilterField, FilterRecordValue } from '../../src/components/filter-bar/filter-bar.js';
import { samplePicture } from './people-samples.js';

/** A book in a sample catalogue, filtered by the filter bar and condition builder labs. */
export interface SampleBook {
  title: string;
  pages: number;
  published: string;
  genre: string;
  readers: readonly string[];
  isAvailable: boolean;
}

export const bookFields: readonly FilterField[] = [
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'pages', label: 'Pages', type: 'number' },
  { id: 'published', label: 'Published', type: 'date' },
  {
    id: 'genre',
    label: 'Genre',
    type: 'choice',
    options: [
      { value: 'fiction', label: 'Fiction' },
      { value: 'history', label: 'History' },
      { value: 'science', label: 'Science' },
      { value: 'travel', label: 'Travel' },
      { value: 'cooking', label: 'Cooking' },
    ],
  },
  {
    id: 'readers',
    label: 'Reader',
    type: 'person',
    options: [
      { value: 'maria', label: 'Maria Santos', description: 'Editor' },
      { value: 'jon', label: 'Jon Berg', description: 'Reviewer', src: samplePicture },
      { value: 'lena', label: 'Lena Ortiz', description: 'Reviewer' },
      { value: 'sam', label: 'Sam Okafor', description: 'Archivist' },
    ],
  },
  { id: 'isAvailable', label: 'Available', type: 'boolean' },
];

export const sampleBooks: readonly SampleBook[] = [
  {
    title: 'The Salt Road',
    pages: 312,
    published: '2019-04-02',
    genre: 'history',
    readers: ['maria'],
    isAvailable: true,
  },
  {
    title: 'Orchards of the North',
    pages: 188,
    published: '2021-09-14',
    genre: 'travel',
    readers: ['jon', 'lena'],
    isAvailable: false,
  },
  {
    title: 'A Lantern at Sea',
    pages: 420,
    published: '2016-01-20',
    genre: 'fiction',
    readers: [],
    isAvailable: true,
  },
  {
    title: 'Bread Without Haste',
    pages: 240,
    published: '2023-03-11',
    genre: 'cooking',
    readers: ['sam'],
    isAvailable: true,
  },
  {
    title: 'The Quiet Atom',
    pages: 356,
    published: '2020-11-05',
    genre: 'science',
    readers: ['maria', 'sam'],
    isAvailable: false,
  },
  {
    title: 'Rivers and Bridges',
    pages: 150,
    published: '2018-06-30',
    genre: 'travel',
    readers: ['lena'],
    isAvailable: true,
  },
  {
    title: 'Tides of the Old Port',
    pages: 512,
    published: '2014-08-08',
    genre: 'history',
    readers: ['jon'],
    isAvailable: true,
  },
  {
    title: 'Small Kitchen Seasons',
    pages: 205,
    published: '2022-02-17',
    genre: 'cooking',
    readers: [],
    isAvailable: false,
  },
];

/** Reads a sample book's value for a field id. */
export function getBookValue(book: SampleBook, fieldId: string): FilterRecordValue {
  return book[fieldId as keyof SampleBook];
}
