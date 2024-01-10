import React, { useState } from 'react';
import GPT3Tokenizer from 'gpt3-tokenizer'
import { oneLine, stripIndent } from 'common-tags'
import { openai } from './openAIClient'
import { supabase } from './supabaseClient'

function TextareaForm() {
  const [textareaText, setTextareaText] = useState('');
  const [answerText, setAnswerText] = useState('');

  const handleTextareaChange = (e) => {
    setTextareaText(e.target.value);
  };

  const handleButtonClick = async () => {
    await searchQuery()
    console.log(`入力されたテキスト: ${textareaText}`);
  };

  const searchQuery = async () => {
    const input = textareaText.replace(/\n/g, ' ')

    // Generate a one-time embedding for the query itself
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input,
    })

    const [{ embedding }] = embeddingResponse.data

    // In production we should handle possible errors
    const { data: documents } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78, // Choose an appropriate threshold for your data
      match_count: 10, // Choose the number of matches
    })

    // console.log(documents)

    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
    let tokenCount = 0
    let contextText = ''

    // Concat matched documents
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]
      const content = document.content
      const encoded = tokenizer.encode(content)
      tokenCount += encoded.text.length

      // Limit context to max 1500 tokens (configurable)
      if (tokenCount > 1500) {
        break
      }

      contextText += `${content.trim()}\n---\n`
    }

    console.log(contextText)
    // return
    const prompt = stripIndent`${oneLine`
    あなたは、とても博学な人です。
    人々を助けるために次のセクションを考慮すると、
    ドキュメントを参照し、その情報のみを使用して質問に答えてください。
    会話形式でで出力されます。 
    ドキュメントに明示的に書かれていない質問があれば、以下のように回答してください。
    「申し訳ありませんが、それについてどうサポートしてよいかわかりません。`}

    Context sections:
    ${contextText}

    Question: """
    ${input}
    """

    回答は丁寧に表現してください:
  `
    // In production we should handle possible errors
    const completionResponse = await openai.completions.create({
      // model: 'text-davinci-003',
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      max_tokens: 512, // Choose the max allowed tokens in completion
      temperature: 0, // Set to 0 for deterministic results
    })


    // const {
    //   id,
    //   choices: [{ text }],
    // } = completionResponse.data
    // console.log(text)
    // console.log(completionResponse.choices[0]['text'])
    setAnswerText(completionResponse.choices[0]['text'])
    // return new Response(JSON.stringify({ id, text }), {
    //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    // })
  }

  return (
    <div>
      <h2>テキストエリアフォーム</h2>
      <textarea
        placeholder="テキストを入力してください"
        value={textareaText}
        onChange={handleTextareaChange}
      />
      <button onClick={handleButtonClick}>メッセージ送信</button>
      <p>{answerText}</p>
    </div>
  );
}

export default TextareaForm;
