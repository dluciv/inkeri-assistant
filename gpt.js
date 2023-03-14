let chatInitialized = false;

export const getGptAnswer = async (t) => {
    try {
        if (t == null || t === '') return null;

        if (!chatInitialized) {
            const iresp = await fetch('http://localhost:5000/chat-init', {
                method: 'POST',
                body: JSON.stringify({
                    female: true,
                    name: 'Инкери'
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
                cache: "no-cache"
            });
            
            const itext = await iresp.text();
            console.log('chat initialized', itext);

            chatInitialized = true;
        }

        const resp = await fetch('http://localhost:5000/chat?q=' + encodeURIComponent(t));
        const json = await resp.json();
        
        console.log('response:', json);

        if (!json.response) return null;

        return json.response;
    }
    catch (error) {
        console.log('gpt: getGptAnswer: error:', error);

        return null;
    }
}