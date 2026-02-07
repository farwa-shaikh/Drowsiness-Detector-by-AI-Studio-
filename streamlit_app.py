import streamlit as st
import os
import json
from PIL import Image

# Import the Google GenAI SDK
# Requires: pip install google-genai
try:
    from google import genai
    from google.genai import types
except ImportError:
    st.error("Missing Dependencies. Please ensure `google-genai` is installed.")
    st.info("If running locally: `pip install google-genai`")
    st.info("If deploying to Streamlit Cloud: Ensure `requirements.txt` exists and contains `google-genai`.")
    st.stop()

# Page Configuration
st.set_page_config(
    page_title="Sentinel Vision",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling to match the React App's Cyberpunk aesthetic
st.markdown("""
<style>
    .stApp {
        background-color: #0a0a0a;
        color: #e0e0e0;
    }
    .stHeader {
        background-color: transparent;
    }
    /* Metrics Styling */
    div[data-testid="stMetric"] {
        background-color: #111111;
        border: 1px solid #1f1f1f;
        padding: 15px;
        border-radius: 8px;
    }
    div[data-testid="stMetricLabel"] {
        color: #00f3ff !important;
        font-family: monospace;
    }
    div[data-testid="stMetricValue"] {
        color: #ffffff !important;
    }
    /* Buttons */
    .stButton button {
        background-color: rgba(0, 243, 255, 0.1);
        border: 1px solid #00f3ff;
        color: #00f3ff;
        font-family: monospace;
        font-weight: bold;
    }
    .stButton button:hover {
        background-color: rgba(0, 243, 255, 0.2);
        border-color: #00f3ff;
        color: #ffffff;
    }
    h1, h2, h3 {
        color: #ffffff;
        font-family: sans-serif;
    }
    .css-1d391kg {
        padding-top: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# Application Header
col_header_1, col_header_2 = st.columns([3, 1])
with col_header_1:
    st.title("Sentinel Vision")
    st.caption("v1.1.0-beta | GEMINI 3 FLASH VISION POWERED")
with col_header_2:
    if st.button("Clear History"):
        st.session_state.history = []

# Initialize Session State
if 'history' not in st.session_state:
    st.session_state.history = []

# Sidebar Configuration
with st.sidebar:
    st.header("SYSTEM CONFIG")
    
    # API Key Management
    api_key = os.environ.get("API_KEY")
    if not api_key:
        api_key = st.text_input("Enter Google API Key", type="password")
        if not api_key:
            st.warning("⚠️ API Key required")
            st.stop()
    else:
        st.success("API Key Detected")

    st.markdown("---")
    st.markdown("**Model:** `gemini-3-flash-preview`")
    st.markdown("**Mode:** `Latency Optimized`")

# Initialize Client
client = genai.Client(api_key=api_key)

# Main Layout
col_cam, col_stats = st.columns([2, 1])

with col_cam:
    st.markdown("### 📡 OPTICAL FEED")
    # Camera Input
    img_file = st.camera_input("Acquire Target", label_visibility="collapsed")

with col_stats:
    st.markdown("### 📊 TELEMETRY")
    
    # Placeholders for metrics
    status_metric = st.empty()
    confidence_metric = st.empty()
    openness_metric = st.empty()
    
    alert_box = st.empty()

# Analysis Logic
if img_file is not None:
    try:
        # Pre-process image
        image = Image.open(img_file)

        # Prompt Engineering
        prompt = """
        Analyze this driver's face for drowsiness monitoring. Focus strictly on the eyes. 
        Classify the state as 'Alert', 'Drowsy', or 'Asleep'.
        Provide a confidence score (0-100) and an estimated eye openness score (0-100, where 100 is fully wide open, 0 is closed).
        """

        with st.spinner("ANALYZING BIOMETRICS..."):
            # Call Gemini API
            # Note: The SDK automatically handles PIL Image objects in contents
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=[image, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "status": {"type": "STRING", "enum": ["Alert", "Drowsy", "Asleep"]},
                            "confidence": {"type": "NUMBER"},
                            "eyeOpenness": {"type": "NUMBER"}
                        },
                        "required": ["status", "confidence", "eyeOpenness"]
                    }
                )
            )

        # Parse Response
        if response.text:
            data = json.loads(response.text)
            
            status = data.get('status', 'Unknown')
            confidence = data.get('confidence', 0)
            openness = data.get('eyeOpenness', 0)

            # Update Metrics
            status_metric.metric("OPERATOR STATUS", status.upper())
            confidence_metric.metric("CONFIDENCE", f"{confidence}%")
            openness_metric.metric("EYE OPENNESS", f"{openness}%")

            # Alert Logic
            if status == "Asleep":
                alert_box.error("🚨 CRITICAL: WAKE UP! OPERATOR UNRESPONSIVE")
            elif status == "Drowsy":
                alert_box.warning("⚠️ WARNING: DROWSINESS DETECTED")
            else:
                alert_box.success("✅ SYSTEM NORMAL: OPERATOR ALERT")
                
            # Log to History
            st.session_state.history.append({
                "time": str(len(st.session_state.history) + 1),
                "status": status,
                "openness": openness
            })

    except Exception as e:
        st.error(f"SYSTEM ERROR: {str(e)}")

# Historical Data Table
if len(st.session_state.history) > 0:
    st.markdown("### 📝 EVENT LOG")
    st.table(st.session_state.history[-5:]) # Show last 5 entries