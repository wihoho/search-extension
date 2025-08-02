#!/usr/bin/env python3
"""
OmniSearch Production Build Script
Creates a clean, production-ready package for Chrome Web Store submission
"""

import os
import shutil
import zipfile
import json
from datetime import datetime

def create_production_build():
    """Create production build package"""
    
    print("🚀 Creating OmniSearch production build...")
    
    # Create build directory
    build_dir = "build"
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(build_dir)
    
    # Files to include in production build
    production_files = [
        "manifest.json",
        "background.js", 
        "popup.html",
        "popup.css",
        "popup.js",
        "welcome.html",
        "welcome.css", 
        "welcome.js",
        "LICENSE",
        "README.md"
    ]
    
    # Directories to include
    production_dirs = [
        "icons"
    ]
    
    print("📁 Copying production files...")
    
    # Copy files
    for file in production_files:
        if os.path.exists(file):
            shutil.copy2(file, build_dir)
            print(f"   ✓ {file}")
        else:
            print(f"   ⚠️  {file} not found")
    
    # Copy directories
    for dir_name in production_dirs:
        if os.path.exists(dir_name):
            shutil.copytree(dir_name, os.path.join(build_dir, dir_name))
            print(f"   ✓ {dir_name}/")
        else:
            print(f"   ⚠️  {dir_name}/ not found")
    
    # Update manifest for production
    print("🔧 Optimizing for production...")
    manifest_path = os.path.join(build_dir, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Remove debug resources
        if 'web_accessible_resources' in manifest:
            for resource_group in manifest['web_accessible_resources']:
                if 'debug.html' in resource_group.get('resources', []):
                    resource_group['resources'].remove('debug.html')
        
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        print("   ✓ Manifest optimized")
    
    # Update background.js for production
    bg_path = os.path.join(build_dir, "background.js")
    if os.path.exists(bg_path):
        with open(bg_path, 'r') as f:
            content = f.read()
        
        # Set DEBUG to false
        content = content.replace('const DEBUG = false;', 'const DEBUG = false;')
        
        with open(bg_path, 'w') as f:
            f.write(content)
        print("   ✓ Background script optimized")
    
    # Create ZIP package
    print("📦 Creating ZIP package...")
    zip_filename = f"omnisearch-v1.0.0-{datetime.now().strftime('%Y%m%d')}.zip"
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, build_dir)
                zipf.write(file_path, arc_path)
                print(f"   ✓ Added {arc_path}")
    
    print(f"\n✅ Production build complete!")
    print(f"📦 Package: {zip_filename}")
    print(f"📁 Build directory: {build_dir}/")
    
    # Validation
    print("\n🔍 Validating package...")
    validate_package(build_dir)
    
    return zip_filename

def validate_package(build_dir):
    """Validate the production package"""
    
    required_files = [
        "manifest.json",
        "background.js",
        "popup.html", 
        "popup.css",
        "popup.js"
    ]
    
    required_icons = [
        "icons/icon16.png",
        "icons/icon48.png", 
        "icons/icon128.png"
    ]
    
    # Check required files
    missing_files = []
    for file in required_files:
        if not os.path.exists(os.path.join(build_dir, file)):
            missing_files.append(file)
    
    # Check required icons
    for icon in required_icons:
        if not os.path.exists(os.path.join(build_dir, icon)):
            missing_files.append(icon)
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    
    # Check manifest
    manifest_path = os.path.join(build_dir, "manifest.json")
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Validate required fields
        required_fields = ['name', 'version', 'description', 'manifest_version']
        for field in required_fields:
            if field not in manifest:
                print(f"❌ Missing manifest field: {field}")
                return False
        
        print("✅ Manifest validation passed")
        
    except json.JSONDecodeError:
        print("❌ Invalid JSON in manifest.json")
        return False
    
    print("✅ Package validation passed")
    return True

def print_submission_checklist():
    """Print Chrome Web Store submission checklist"""
    
    print("\n" + "="*60)
    print("📋 CHROME WEB STORE SUBMISSION CHECKLIST")
    print("="*60)
    
    checklist = [
        "Create developer account ($5 fee)",
        "Generate store assets (promotional images)",
        "Take actual screenshots of extension",
        "Write compelling store description", 
        "Set up privacy policy hosting",
        "Test extension thoroughly",
        "Upload ZIP package",
        "Fill out store listing details",
        "Submit for review"
    ]
    
    for i, item in enumerate(checklist, 1):
        print(f"{i:2d}. [ ] {item}")
    
    print("\n📚 Resources:")
    print("   - Store assets: create_store_assets.html")
    print("   - Listing content: STORE_LISTING.md") 
    print("   - Privacy policy: PRIVACY_POLICY.md")
    print("   - Testing guide: TESTING.md")

if __name__ == "__main__":
    try:
        zip_file = create_production_build()
        print_submission_checklist()
        
        print(f"\n🎉 Ready for Chrome Web Store submission!")
        print(f"📦 Upload this file: {zip_file}")
        
    except Exception as e:
        print(f"❌ Build failed: {e}")
        exit(1)
