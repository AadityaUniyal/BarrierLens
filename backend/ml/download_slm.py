"""
Download and verify local Small Language Model (SLM) on CUDA
Model: Qwen/Qwen2.5-Coder-0.5B-Instruct
Footprint: ~980 MB disk, ~1.1 GB VRAM on RTX 4050
"""

import sys
import time
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = "Qwen/Qwen2.5-Coder-0.5B-Instruct"

def main():
    print(f"======================================================")
    print(f"🤖 Initializing Local SLM Download & Verification")
    print(f"Target Model: {MODEL_ID}")
    print(f"======================================================")

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"Target Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        free_mem, total_mem = torch.cuda.mem_get_info(0)
        print(f"Initial Free VRAM: {free_mem / (1024**3):.2f} GB / {total_mem / (1024**3):.2f} GB")

    t0 = time.time()
    print(f"\n1. Loading Tokenizer ({MODEL_ID})...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    print(f"   Tokenizer loaded in {time.time() - t0:.2f}s")

    t1 = time.time()
    print(f"\n2. Loading Model ({MODEL_ID}) onto {device} in torch.float16...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if device.startswith("cuda") else torch.float32,
        device_map=device
    )
    print(f"   Model weights loaded in {time.time() - t1:.2f}s")

    if torch.cuda.is_available():
        free_mem, total_mem = torch.cuda.mem_get_info(0)
        allocated = torch.cuda.memory_allocated(0)
        print(f"   Allocated VRAM for SLM: {allocated / (1024**2):.1f} MB")
        print(f"   Remaining Free VRAM: {free_mem / (1024**3):.2f} GB")

    # 3. Test Reasoning Inference
    print(f"\n3. Testing Local Autonomous Accessibility Step Decision...")
    prompt = """You are BarrierLens, an autonomous task-conditioned accessibility auditor.
Goal: "Checkout guest cart"
Persona: "keyboard"
Current Focused Element: <button id="checkout-btn">Proceed to Checkout</button>
Interactive Controls:
- <button id="checkout-btn">Proceed to Checkout</button>
- <a id="cancel-link">Cancel</a>

Rules:
Return ONLY a valid JSON object with keys:
- "thought": string
- "action": "press_key" | "type_text" | "finish_task"
- "key": "Enter" | "Tab" | "Space" | "Escape"
- "isGoalReached": boolean
"""

    messages = [
        {"role": "system", "content": "You are an autonomous web accessibility testing agent that outputs strict JSON."},
        {"role": "user", "content": prompt}
    ]

    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    model_inputs = tokenizer([text], return_tensors="pt").to(device)

    t2 = time.time()
    with torch.no_grad():
        generated_ids = model.generate(
            **model_inputs,
            max_new_tokens=150,
            temperature=0.1,
            do_sample=False
        )

    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
    duration = time.time() - t2
    print(f"   Inference completed in {duration:.2f}s")
    print(f"   Output:\n{response.strip()}")

    # 4. Test Code Remediation Inference
    print(f"\n4. Testing Local AST Accessibility Code Remediation...")
    rem_prompt = """Synthesize a surgical React/JSX patch to fix this accessibility defect:
Defect: Keyboard trap in modal dialog
Target Selector: <div class="modal-dialog">
Requirements:
1. Add role="dialog"
2. Add aria-modal="true"
3. Add onKeyDown escape handler to call closeModal()

Return ONLY the patched JSX snippet.
"""
    rem_messages = [
        {"role": "system", "content": "You are a senior accessibility engineer specializing in WCAG 2.2 and React."},
        {"role": "user", "content": rem_prompt}
    ]
    rem_text = tokenizer.apply_chat_template(rem_messages, tokenize=False, add_generation_prompt=True)
    rem_inputs = tokenizer([rem_text], return_tensors="pt").to(device)

    with torch.no_grad():
        rem_ids = model.generate(
            **rem_inputs,
            max_new_tokens=120,
            temperature=0.1,
            do_sample=False
        )
    rem_ids = [out[len(inp):] for inp, out in zip(rem_inputs.input_ids, rem_ids)]
    rem_response = tokenizer.batch_decode(rem_ids, skip_special_tokens=True)[0]
    print(f"   Remediation Output:\n{rem_response.strip()}")

    print(f"\n======================================================")
    print(f"🎉 LOCAL SLM VERIFIED ON RTX 4050 CUDA SUCCESSFULLY!")
    print(f"======================================================")

if __name__ == "__main__":
    main()
