import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUpload, type FileUploadItem } from './file-upload.js';

function list(...names: string[]): FileUploadItem[] {
  return names.map((name) => ({
    id: name,
    name,
    file: new File([`Contents of ${name}`], name, { type: 'text/plain', lastModified: 1234 }),
  }));
}

function collect(name = 'Documents'): FormData {
  const form = screen.getByRole('form', { name }) as HTMLFormElement;
  // jsdom serializes native empty placeholders but does not dispatch the browser's formdata event.
  const formData = new FormData(form);
  form.dispatchEvent(Object.assign(new Event('formdata'), { formData }));
  return formData;
}

function entries(data: FormData) {
  return Array.from(data, ([name, value]) => [
    name,
    typeof value === 'string' ? value : value.name,
  ]);
}

describe('FileUpload form data', () => {
  beforeEach(() => vi.stubGlobal('DataTransfer', undefined));

  it('UIC-FILE-UPLOAD-4.2 preserves all entries in order around uploads sharing a name', async () => {
    const first = list('a.txt', 'b.txt');
    const second = list('c.txt');
    render(
      <form aria-label="Documents">
        <input type="hidden" name="docs" value="existing" />
        <FileUpload label="First" name="docs" files={first} onSelect={() => {}} />
        <input name="other" aria-label="Other" defaultValue="between names" />
        <input name="docs" aria-label="Middle" defaultValue="middle" />
        <FileUpload label="Second" name="docs" files={second} onSelect={() => {}} />
        <input type="hidden" name="docs" value="last" />
      </form>,
    );
    const expected = [
      ['docs', 'existing'],
      ['docs', 'a.txt'],
      ['docs', 'b.txt'],
      ['other', 'between names'],
      ['docs', 'middle'],
      ['docs', 'c.txt'],
      ['docs', 'last'],
    ];
    const data = collect();
    expect(entries(data)).toEqual(expected);
    expect(data.getAll('docs')).toEqual([
      'existing',
      first[0]?.file,
      first[1]?.file,
      'middle',
      second[0]?.file,
      'last',
    ]);
    const submitted = data.getAll('docs')[1] as File;
    expect(submitted).toMatchObject({ type: 'text/plain', lastModified: 1234 });
    const contents = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Cannot read submitted file'));
      reader.readAsText(submitted);
    });
    expect(contents).toBe('Contents of a.txt');
    expect(entries(collect())).toEqual(expected);
  });

  it('UIC-FILE-UPLOAD-4.2 keeps distinct names and empty native inputs, including empty uploads', () => {
    render(
      <form aria-label="Documents">
        <label>
          Native before
          <input type="file" name="docs" />
        </label>
        <FileUpload label="First" name="docs" files={list('a.txt')} onSelect={() => {}} />
        <FileUpload label="Empty" name="docs" onSelect={() => {}} />
        <FileUpload label="Second" name="images" files={list('b.txt')} onSelect={() => {}} />
        <label>
          Native after
          <input type="file" name="docs" />
        </label>
      </form>,
    );
    expect(entries(collect())).toEqual([
      ['docs', ''],
      ['docs', 'a.txt'],
      ['docs', ''],
      ['images', 'b.txt'],
      ['docs', ''],
    ]);
  });

  it('UIC-FILE-UPLOAD-4.2 omits disabled and datalist controls while retaining first-legend files', () => {
    render(
      <form aria-label="Documents">
        <FileUpload
          label="Disabled"
          name="docs"
          isDisabled
          files={list('disabled.txt')}
          onSelect={() => {}}
        />
        <fieldset disabled>
          <legend>
            <FileUpload label="Legend" name="docs" files={list('legend.txt')} onSelect={() => {}} />
          </legend>
          <label>
            Disabled native
            <input type="file" name="docs" />
          </label>
          <FileUpload
            label="Inherited"
            name="docs"
            files={list('inherited.txt')}
            onSelect={() => {}}
          />
        </fieldset>
        <datalist>
          <FileUpload
            label="Suggestions"
            name="docs"
            files={list('suggestion.txt')}
            onSelect={() => {}}
          />
        </datalist>
        <FileUpload label="Enabled" name="docs" files={list('enabled.txt')} onSelect={() => {}} />
      </form>,
    );
    expect(entries(collect())).toEqual([
      ['docs', 'legend.txt'],
      ['docs', 'enabled.txt'],
    ]);
  });

  it('UIC-FILE-UPLOAD-4.2 uses current names, files, disabled state and external form ownership', () => {
    const view = (isDisabled: boolean, files = list('a.txt')) => (
      <>
        <form id="documents" aria-label="Documents">
          <input type="hidden" name="docs" value="existing" />
        </form>
        <FileUpload
          label="External"
          name="docs"
          isDisabled={isDisabled}
          files={files}
          onSelect={() => {}}
        />
      </>
    );
    const { rerender } = render(view(false));
    const input = document.querySelector<HTMLInputElement>('input[type="file"][name="docs"]');
    input?.setAttribute('form', 'documents');
    expect(entries(collect())).toEqual([
      ['docs', 'existing'],
      ['docs', 'a.txt'],
    ]);
    rerender(view(true));
    expect(entries(collect())).toEqual([['docs', 'existing']]);
    rerender(view(false, list('b.txt', 'c.txt')));
    input?.setAttribute('name', 'updated');
    expect(entries(collect())).toEqual([
      ['docs', 'existing'],
      ['updated', 'b.txt'],
      ['updated', 'c.txt'],
    ]);
  });

  it('UIC-FILE-UPLOAD-4.2 follows DOM order after uploads move without remounting', () => {
    render(
      <form aria-label="Documents">
        <FileUpload label="First" name="docs" files={list('a.txt')} onSelect={() => {}} />
        <input type="hidden" name="docs" value="middle" />
        <FileUpload label="Second" name="docs" files={list('b.txt')} onSelect={() => {}} />
      </form>,
    );
    const form = screen.getByRole('form', { name: 'Documents' });
    const first = screen.getByRole('button', { name: 'First' }).closest('.ui-file-upload');
    if (!first) throw new Error('Missing upload');
    form.append(first);
    expect(entries(collect())).toEqual([
      ['docs', 'middle'],
      ['docs', 'b.txt'],
      ['docs', 'a.txt'],
    ]);
  });

  it('UIC-FILE-UPLOAD-4.2 preserves shared names when collecting immediately after reset', () => {
    render(
      <form aria-label="Documents">
        <input type="hidden" name="docs" value="existing" />
        <FileUpload label="First" name="docs" files={list('a.txt')} onSelect={() => {}} />
        <FileUpload label="Second" name="docs" files={list('b.txt')} onSelect={() => {}} />
      </form>,
    );
    let submitted: FormData | undefined;
    act(() => {
      (screen.getByRole('form', { name: 'Documents' }) as HTMLFormElement).reset();
      submitted = collect();
    });
    expect(submitted && entries(submitted)).toEqual([
      ['docs', 'existing'],
      ['docs', 'a.txt'],
      ['docs', 'b.txt'],
    ]);
  });

  it('UIC-FILE-UPLOAD-4.2 releases registrations across unmounts and StrictMode remounts', () => {
    const view = (showFirst: boolean, showSecond: boolean) => (
      <StrictMode>
        <form aria-label="Documents">
          <input type="hidden" name="docs" value="existing" />
          {showFirst ? (
            <FileUpload
              key="first"
              label="First"
              name="docs"
              files={list('a.txt')}
              onSelect={() => {}}
            />
          ) : null}
          {showSecond ? (
            <FileUpload
              key="second"
              label="Second"
              name="docs"
              files={list('b.txt')}
              onSelect={() => {}}
            />
          ) : null}
        </form>
      </StrictMode>
    );
    const { rerender, unmount } = render(view(true, true));
    rerender(view(false, true));
    expect(entries(collect())).toEqual([
      ['docs', 'existing'],
      ['docs', 'b.txt'],
    ]);
    rerender(view(false, false));
    expect(entries(collect())).toEqual([['docs', 'existing']]);
    rerender(view(true, false));
    expect(entries(collect())).toEqual([
      ['docs', 'existing'],
      ['docs', 'a.txt'],
    ]);
    unmount();
    render(view(true, true));
    expect(entries(collect())).toEqual([
      ['docs', 'existing'],
      ['docs', 'a.txt'],
      ['docs', 'b.txt'],
    ]);
  });
});
