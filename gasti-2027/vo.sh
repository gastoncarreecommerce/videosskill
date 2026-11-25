#!/bin/bash
# Usage: ./vo.sh <voice_id> [model]   — regenerates assets/vo/*.mp3 and tx/*.json with ElevenLabs
VOICE=${1:?voice id}; MODEL=${2:-eleven_multilingual_v2}
cd "$(dirname "$0")"
node -e 'require("./vo.json").forEach(([id,t])=>console.log(id+"\t"+JSON.stringify({text:t,model_id:process.argv[1],language_code:"es",voice_settings:{stability:0.55,similarity_boost:0.75,style:0.15}})))' "$MODEL" > vo.tsv
while IFS=$'\t' read -r id body; do
  curl -s -w "$id %{http_code}\n" -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE?output_format=mp3_44100_128" -H "xi-api-key: ${XI_API_KEY:-proxy-injected}" -H "Content-Type: application/json" --data-raw "$body" -o assets/vo/$id.mp3
  curl -s -X POST https://api.elevenlabs.io/v1/speech-to-text -H "xi-api-key: ${XI_API_KEY:-proxy-injected}" -F model_id=scribe_v1 -F language_code=spa -F file=@assets/vo/$id.mp3 -o tx/$id.json
done < vo.tsv
