export async function fetchAi(upimessage:string,categories: string[]) {
    try {
        const res=await fetch("http://10.69.179.4:8000/ask-gemini",{
            method:"POST",
            headers:{
                "Content-Type": "application/json"
            },
            body:JSON.stringify({prompt:upimessage, categories:categories})
        }
        )
         if (!res.ok) {
      throw new Error("Gemini API call failed");
    }
    const text= await res.text();
    const parsed=JSON.parse(text);
    console.log(" AI Response:", parsed);
    return parsed;
    } catch (error) {
        console.error("Gemini error",error);
        return null;
    }
}