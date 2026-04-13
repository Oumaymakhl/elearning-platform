#!/bin/bash
FILE="frontend/angular-app/src/app/pages/messaging/messaging.component.ts"

# Bug 1 - SSE lastId avec Math.max
sed -i "s/this\.startSSE(conv\.id, msgs\.length > 0 ? msgs\[msgs\.length - 1\]\.id : 0);/const maxId = msgs.length > 0 ? Math.max(...msgs.map((m: any) => m.id)) : 0;\n        this.startSSE(conv.id, maxId);/" "$FILE"

# Bug 3 - Avatar URL normalisé
sed -i "s|avatar_url: u\.avatar ? \`/storage/\${u\.avatar}\` : null|avatar_url: u.avatar ? (u.avatar.startsWith('http') ? u.avatar : \`http://localhost:8001/storage/\${u.avatar}\`) : null|" "$FILE"

# Bug 4 - CSS offline
sed -i "s|\.chat-status { font-size:\.72rem; color:#22c55e; font-weight:600; margin-top:1px; }|.chat-status { font-size:.72rem; color:#22c55e; font-weight:600; margin-top:1px; }\n    .chat-status.offline { color:#94a3b8; }|" "$FILE"

echo "✅ Corrections appliquées sur $FILE"
