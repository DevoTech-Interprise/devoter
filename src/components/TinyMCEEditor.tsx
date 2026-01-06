// src/components/TinyMCEEditor.tsx
import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

export const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value,
  onChange,
  height = 400
}) => {
  return (
    <Editor
      value={value}
      onEditorChange={onChange}
      apiKey='pt7ck66l6yzvbtt0t36vx7h0qs9c2gaj7yo7dkmx9rqzip9o'
      init={{
        height,
        menubar: 'file edit view insert format tools table help',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
        content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 14px }',
        language: 'pt_BR',
        skin: 'oxide',
        branding: false
      }}
    />
  );
};