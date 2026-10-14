'use client';
import { RichTextEditor, Link as LinkExtension } from '@mantine/tiptap';
import { useEditor, useEditorState } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { Stack, Button, Text, Group, NumberInput, TextInput, Paper } from '@mantine/core';
import type { RichNode } from '@/app/lib/cms-types';
import { MediaPicker } from './media-picker';
const CmsImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), mediaId: { default: null }, width: { default: null }, height: { default: null } };
  },
  renderHTML({ HTMLAttributes }) {
    const id = HTMLAttributes.mediaId;
    return [
      'img',
      {
        ...HTMLAttributes,
        style: 'max-width:100%;height:auto',
        ...(id ? { src: '/api/admin/cms/media/' + id + '/file' } : {}),
      },
    ];
  },
});
export function RichEditor({
  label,
  value,
  onChange,
  onUploadingChange,
}: {
  label: string;
  value: RichNode;
  onChange: (document: RichNode) => void;
  onUploadingChange?: (busy: boolean) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [2, 3, 4] }, codeBlock: false }),
      LinkExtension,
      CmsImage,
      TableKit,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
  });
  const selection = useEditorState({
    editor,
    selector: ({ editor }) => ({
      image: editor?.isActive('image') ?? false,
      width: editor?.getAttributes('image').width as number | null,
      alt: String(editor?.getAttributes('image').alt ?? ''),
      table: editor?.isActive('table') ?? false,
    }),
  });
  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">
        {label}
      </Text>
      <Text size="sm" c="dimmed">
        Выделите текст, чтобы изменить оформление. Используйте заголовки, списки и цитаты; изображения можно загрузить
        под редактором в позицию курсора. Нажмите на вставленное изображение, чтобы изменить размер или удалить его.
      </Text>
      <RichTextEditor
        editor={editor}
        labels={{
          boldControlLabel: 'Жирный',
          italicControlLabel: 'Курсив',
          underlineControlLabel: 'Подчёркнутый',
          strikeControlLabel: 'Зачёркнутый',
          clearFormattingControlLabel: 'Очистить форматирование',
          linkControlLabel: 'Ссылка',
          unlinkControlLabel: 'Удалить ссылку',
          bulletListControlLabel: 'Маркированный список',
          orderedListControlLabel: 'Нумерованный список',
          h2ControlLabel: 'Заголовок 2',
          h3ControlLabel: 'Заголовок 3',
          h4ControlLabel: 'Заголовок 4',
          blockquoteControlLabel: 'Цитата',
          undoControlLabel: 'Отменить',
          redoControlLabel: 'Повторить',
          linkEditorInputLabel: 'Адрес ссылки',
          linkEditorInputPlaceholder: 'https://',
          linkEditorExternalLink: 'Открывать в новой вкладке',
          linkEditorInternalLink: 'В этой вкладке',
          linkEditorSave: 'Сохранить ссылку',
        }}
      >
        <RichTextEditor.Toolbar sticky stickyOffset={70}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.ClearFormatting />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.H2 />
            <RichTextEditor.H3 />
            <RichTextEditor.H4 />
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Blockquote />
          </RichTextEditor.ControlsGroup>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>
        <RichTextEditor.Content />
      </RichTextEditor>
      {selection?.image && (
        <Paper withBorder p="md" radius="md" aria-label="Настройки изображения">
          <Stack gap="sm">
            <Text fw={600}>Выбранное изображение</Text>
            <Group align="end">
              <NumberInput
                label="Ширина изображения, px"
                description="Высота подстраивается автоматически. На телефоне изображение не выходит за экран."
                min={1}
                max={2400}
                allowDecimal={false}
                value={selection.width ?? ''}
                placeholder="По ширине текста"
                onChange={(width) =>
                  editor?.commands.updateAttributes('image', {
                    width: typeof width === 'number' ? width : null,
                    height: null,
                  })
                }
              />
              <Button
                variant="light"
                onClick={() => editor?.chain().focus().updateAttributes('image', { width: 320, height: null }).run()}
              >
                Маленькое
              </Button>
              <Button
                variant="light"
                onClick={() => editor?.chain().focus().updateAttributes('image', { width: 640, height: null }).run()}
              >
                Среднее
              </Button>
              <Button
                variant="light"
                onClick={() => editor?.chain().focus().updateAttributes('image', { width: null, height: null }).run()}
              >
                По ширине текста
              </Button>
            </Group>
            <TextInput
              label="Описание изображения"
              description="Кратко опишите, что изображено на фотографии."
              maxLength={500}
              value={selection.alt}
              onChange={(event) => editor?.commands.updateAttributes('image', { alt: event.currentTarget.value })}
            />
            <Button
              color="red"
              variant="light"
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .command(({ tr }) => {
                    closeHistory(tr);
                    return true;
                  })
                  .deleteSelection()
                  .run()
              }
            >
              Удалить изображение из текста
            </Button>
          </Stack>
        </Paper>
      )}
      {selection?.table && (
        <Group>
          <Button variant="light" onClick={() => editor?.chain().focus().addRowAfter().run()}>
            Добавить строку
          </Button>
          <Button variant="light" onClick={() => editor?.chain().focus().addColumnAfter().run()}>
            Добавить столбец
          </Button>
          <Button variant="light" onClick={() => editor?.chain().focus().deleteRow().run()}>
            Удалить строку
          </Button>
          <Button variant="light" onClick={() => editor?.chain().focus().deleteColumn().run()}>
            Удалить столбец
          </Button>
          <Button color="red" variant="light" onClick={() => editor?.chain().focus().deleteTable().run()}>
            Удалить таблицу
          </Button>
        </Group>
      )}
      <MediaPicker
        onUploadingChange={onUploadingChange}
        label="Вставить изображение в текст"
        value={null}
        onChange={(value) => {
          if (typeof value === 'string')
            editor
              ?.chain()
              .focus()
              .setImage({ src: `/media/${value}`, alt: '' } as Parameters<
                ReturnType<NonNullable<typeof editor>['chain']>['setImage']
              >[0])
              .updateAttributes('image', { mediaId: value })
              .run();
        }}
      />
      <Button
        variant="subtle"
        onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        Добавить таблицу
      </Button>
    </Stack>
  );
}
