import os

def split_css():
    with open('styles.css', 'r', encoding='utf-8') as f:
        content = f.read()

    # The file has sections separated by:
    # /* ==========================================
    #    [Section Name]
    #    ========================================== */

    import re
    sections = re.split(r'/\* ==========================================\s*(.*?)\s*========================================== \*/', content)

    # sections[0] is the base styles (root, imports, general tags)
    styles_content = sections[0]
    layout_content = ''
    components_content = ''
    animations_content = ''

    # Keyframes were just dumped randomly in styles.css...
    # We will find @keyframes and move them to animations.
    
    i = 1
    while i < len(sections):
        title = sections[i].strip()
        body = sections[i+1]
        
        # Build the block with header
        block = '/* ==========================================\n   ' + title + '\n   ========================================== */\n' + body
        
        if 'Scroll Reveal System' in title:
            animations_content += block
        elif 'Navigation' in title or 'Hero Section' in title or 'Timeline Section' in title or 'Contact Section' in title or 'Mobile Responsiveness' in title or 'Hover-capable devices' in title:
            layout_content += block
        elif 'Capability Rings' in title or 'Capability Modal' in title or 'Project Cards Feed' in title or 'Education Cards' in title:
            components_content += block
        else:
            styles_content += block
            
        i += 2

    # Extract rogue keyframes from styles_content and layout_content ( Hero Section had @keyframes )
    def extract_keyframes(text):
        keyframes = []
        def replacer(match):
            keyframes.append(match.group(0))
            return '\n'
        new_text = re.sub(r'@keyframes[^{]+\{.*?\n\}', replacer, text, flags=re.DOTALL)
        # some keyframes have nested brackets, simplistic regex might fail if there's nested
        return new_text, ''.join(keyframes)
        
    # Python regex for nested brackets is hard, so let's do a simple brace counter loop
    def extract_keyframes_manual(text):
        out_text = ""
        kf_text = ""
        idx = 0
        while idx < len(text):
            kf_idx = text.find("@keyframes", idx)
            if kf_idx == -1:
                out_text += text[idx:]
                break
                
            out_text += text[idx:kf_idx]
            
            # find matching closing brace
            brace_count = 0
            in_kf = True
            started_braces = False
            for j in range(kf_idx, len(text)):
                if text[j] == '{':
                    brace_count += 1
                    started_braces = True
                elif text[j] == '}':
                    brace_count -= 1
                    
                if started_braces and brace_count == 0:
                    kf_text += text[kf_idx:j+1] + "\n\n"
                    idx = j + 1
                    break
            else:
                idx = len(text) # fallback
                
        return out_text, kf_text

    styles_content, kf1 = extract_keyframes_manual(styles_content)
    layout_content, kf2 = extract_keyframes_manual(layout_content)
    components_content, kf3 = extract_keyframes_manual(components_content)
    
    animations_content += "\n" + kf1 + kf2 + kf3

    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(styles_content.strip() + "\n")
        
    with open('layout.css', 'w', encoding='utf-8') as f:
        f.write(layout_content.strip() + "\n")
        
    with open('components.css', 'w', encoding='utf-8') as f:
        f.write(components_content.strip() + "\n")
        
    with open('animations.css', 'w', encoding='utf-8') as f:
        f.write(animations_content.strip() + "\n")

    print("- Extracted to 4 files successfully.")

split_css()
