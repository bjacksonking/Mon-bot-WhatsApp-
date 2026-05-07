import configmanager from '../utils/configmanager.js'

const antilinkSettings = {}
const warnStorage = {}

export async function antilink(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const senderId = message.key.participant || groupId
        const sender = metadata.participants.find(p => p.id === senderId)
        
        if (!sender?.admin) {
            return await client.sendMessage(groupId, { 
                text: '🔒 *Admins uniquement !*' 
            })
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
        const args = text.split(/\s+/).slice(1)
        const action = args[0]?.toLowerCase()

        if (!action) {
            const usage = `🔒 *Digital Crew 243 - Antilink*\n\n.antilink on\n.antilink off\n.antilink set delete | kick | warn\n.antilink status`
            return await client.sendMessage(groupId, { text: usage })
        }

        switch (action) {
            case 'on':
                antilinkSettings[groupId] = { enabled: true, action: 'delete' }
                await client.sendMessage(groupId, { 
                    text: '✅ *Antilink activé*' 
                })
                break

            case 'off':
                delete antilinkSettings[groupId]
                await client.sendMessage(groupId, { 
                    text: '❌ *Antilink désactivé*' 
                })
                break

            case 'set':
                if (args.length < 2) {
                    return await client.sendMessage(groupId, { 
                        text: '❌ Usage: .antilink set delete | kick | warn' 
                    })
                }
                const setAction = args[1].toLowerCase()
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    return await client.sendMessage(groupId, { 
                        text: '❌ Actions: delete, kick, warn' 
                    })
                }
                if (!antilinkSettings[groupId]) {
                    antilinkSettings[groupId] = { enabled: true, action: setAction }
                } else {
                    antilinkSettings[groupId].action = setAction
                }
                await client.sendMessage(groupId, { 
                    text: `✅ *Action:* ${setAction}` 
                })
                break

            case 'status':
                const status = antilinkSettings[groupId]
                await client.sendMessage(groupId, { 
                    text: `📊 *Statut*\n\nActivé: ${status?.enabled ? '✅' : '❌'}\nAction: ${status?.action || 'Aucune'}` 
                })
                break

            default:
                await client.sendMessage(groupId, { 
                    text: '❌ Usage: .antilink on/off/set/status' 
                })
        }
    } catch (error) {
        console.error('Antilink error:', error)
    }
}

export async function linkDetection(client, message) {
    console.log('🔍 LINK DETECTION CALLED')
    
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) {
        console.log('🟡 Not a group')
        return
    }
    
    const setting = antilinkSettings[groupId]
    if (!setting?.enabled) {
        console.log('🟡 Antilink disabled for group')
        return
    }
    
    const senderId = message.key.participant || groupId
    const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    
    console.log('Checking text:', messageText.substring(0, 50))
    
    const linkPatterns = [
        /https?:\/\//i,
        /www\./i,
        /\.com\b/i,
        /\.net\b/i,
        /\.org\b/i,
        /tiktok\.com/i,
        /instagram\.com/i,
        /facebook\.com/i,
        /whatsapp\.com/i,
        /chat\.whatsapp\.com/i,
        /t\.me/i,
        /telegram/i,
        /discord/i,
        /youtube\.com/i,
        /youtu\.be/i
    ]
    
    const hasLink = linkPatterns.some(pattern => pattern.test(messageText))
    if (!hasLink) {
        console.log('🟡 No link found')
        return
    }
    
    console.log('🟢 Link detected!')
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const sender = metadata.participants.find(p => p.id === senderId)
        const bot = metadata.participants.find(p => p.id.includes(client.user.id.split(':')[0]))
        
        if (sender?.admin) {
            console.log('🟡 Sender is admin, skipping')
            return
        }
        
        if (!bot?.admin) {
            console.log('🟡 Bot not admin, skipping')
            return
        }
        
        console.log('🟢 Taking action:', setting.action)
        
        if (setting.action === 'delete' || setting.action === 'kick' || setting.action === 'warn') {
            try {
                await client.sendMessage(groupId, {
                    delete: message.key
                })
                console.log('✅ Message deleted')
            } catch (deleteError) {
                console.log('❌ Delete failed:', deleteError.message)
            }
        }
        
        const platforms = []
        if (/tiktok\.com/i.test(messageText)) platforms.push('TikTok')
        if (/instagram\.com/i.test(messageText)) platforms.push('Instagram')
        if (/facebook\.com/i.test(messageText)) platforms.push('Facebook')
        if (/whatsapp\.com/i.test(messageText)) platforms.push('WhatsApp')
        if (/t\.me|telegram/i.test(messageText)) platforms.push('Telegram')
        if (/discord/i.test(messageText)) platforms.push('Discord')
        if (/youtube\.com|youtu\.be/i.test(messageText)) platforms.push('YouTube')
        if (platforms.length === 0) platforms.push('Site Web')
        
        if (setting.action === 'warn') {
            const warnKey = `${groupId}_${senderId}`
            warnStorage[warnKey] = (warnStorage[warnKey] || 0) + 1
            const warns = warnStorage[warnKey]
            
            await client.sendMessage(groupId, {
                text: `🚫 *Lien ${platforms.join('/')}*\nWarn ${warns}/3\n@${senderId.split('@')[0]}`,
                mentions: [senderId]
            })