from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from config import settings
from memory import get_message_history

class LLMChainFactory:
    """
    Factory class to create optimized LCEL (LangChain Expression Language) chains.
    """
    
    @staticmethod
    def get_llm(model_name: str = settings.DEFAULT_MODEL):
        """
        Initializes the ChatOllama client.
        
        Args:
            model_name (str): The name of the model to use (e.g., llama3, mistral).
        """
        return ChatOllama(
            base_url=settings.OLLAMA_URL,
            model=model_name,
            temperature=0.7,
            streaming=True # Enable streaming at the model level
        )

    @staticmethod
    def create_conversational_chain(model_name: str, system_prompt: str):
        """
        Creates a Conversational RAG-ready chain using LCEL.
        
        Structure:
        Prompt Template -> LLM -> Output Parser
        
        Wrapped with 'RunnableWithMessageHistory' to automatically handle Redis history.
        """
        
        # 1. Define the Prompt Template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"), # Inject history here
            ("human", "{input}"),
        ])
        
        # 2. Initialize LLM
        llm = LLMChainFactory.get_llm(model_name)
        
        # 3. Create the Chain
        chain = prompt | llm | StrOutputParser()
        
        # 4. Wrap with History Management
        runnable_with_history = RunnableWithMessageHistory(
            chain,
            get_message_history, # Function to fetch Redis history
            input_messages_key="input",
            history_messages_key="history",
        )
        
        return runnable_with_history