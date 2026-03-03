import os

# Thư mục gốc sẽ được tạo ngay trong thư mục 'chariti' hiện tại của bạn
base_dir = "charitable-fund-backend"

# Danh sách các file cần tạo (kèm theo đường dẫn thư mục)
files_to_create = [
    "src/config/db.js",
    "src/models/User.js",
    "src/models/Campaign.js",
    "src/models/Donation.js",
    "src/models/Disbursement.js",
    "src/routes/auth.js",
    "src/controllers/authController.js",
    "src/middlewares/auth.js",
    ".env",
    ".gitignore",
    "server.js"
]

# Danh sách các thư mục cần tạo (những thư mục rỗng như utils)
folders_to_create = [
    "src/utils"
]

def setup_project_structure():
    print(f"Đang tạo cấu trúc dự án trong thư mục: {base_dir}/ ...\n")
    
    # 1. Tạo các file và thư mục chứa nó
    for file_path in files_to_create:
        full_path = os.path.join(base_dir, file_path)
        
        # Lấy đường dẫn thư mục cha của file và tạo nếu chưa tồn tại
        directory = os.path.dirname(full_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
            
        # Tạo file trống
        with open(full_path, 'w', encoding='utf-8') as f:
            pass 
        print(f"📄 Đã tạo file: {full_path}")

    # 2. Tạo các thư mục rỗng
    for folder_path in folders_to_create:
        full_path = os.path.join(base_dir, folder_path)
        os.makedirs(full_path, exist_ok=True)
        print(f"📁 Đã tạo thư mục: {full_path}")

    print("\n✅ Hoàn tất! Cấu trúc thư mục đã sẵn sàng.")

if __name__ == "__main__":
    setup_project_structure()