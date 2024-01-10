import React, { useState } from 'react';
import { openai } from './openAIClient'
import { supabase } from './supabaseClient'

function InputForm() {
  const [inputText, setInputText] = useState('');

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleButtonClick = async () => {
    // const data = await fetchTasks()
    // console.log(data)
    await generateEmbeddings()
    console.log(`入力されたテキスト: ${inputText}`);
  };

  async function generateEmbeddings() {
    const input = inputText

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: input,
    })

    console.log(embeddingResponse.data)

    const [{ embedding }] = embeddingResponse.data
    console.log(embedding)

    await supabase.from('documents').insert({
      content: input,
      embedding,
    })
  }

  async function fetchTasks() {
    const { data, error } = await supabase.from('sheet').select('*');
    if (error) {
      console.error('データの取得中にエラーが発生しました:', error.message);
      return [];
    }
    return data;
  }

  return (
    <div>
      <h2>Inputフォーム</h2>
      <textarea
        placeholder="テキストを入力してください"
        value={inputText}
        onChange={handleInputChange}
      />
      <button onClick={handleButtonClick}>埋め込みを作成</button>
    </div>
  );
}

export default InputForm;
