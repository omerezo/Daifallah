# Dhaifallah Sons Charity Management System

A professional management system for the Dhaifallah Sons Charity, built with Next.js, Firebase, and ShadCN UI.

## How to Get Your Code

### Method 1: Push to GitHub (Recommended)

To connect this local project to your GitHub repository and push your code, run the following commands in your terminal:

```bash
# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Management system with multi-payment and official letters features"

# Add your remote repository
git remote add origin https://github.com/omerezo/Daifallah.git

# Set the branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

Once pushed, you can download or clone the repository from GitHub to any computer.

### Method 2: Direct Download as ZIP

If you want to download a copy of the project directly from this cloud environment:

1.  **Open the Terminal** in this window.
2.  **Run this command** to create a compressed ZIP file (excluding large folders like node_modules):
    ```bash
    zip -r project.zip . -x "node_modules/*" ".next/*" ".git/*"
    ```
3.  **Right-click `project.zip`** in the file explorer on the left and select **Download**.

## Features

- **Multi-language Support:** Full Arabic and English interfaces.
- **Payment Management:** Record single payments or bulk payments across multiple months.
- **Official Letters:** Create, format, and export official charity letters as PDF or Word documents with rich text editing.
- **Financial Reporting:** Monthly and yearly visual reports of income and expenses.
- **Wallet System:** Manage different funds and track their transaction history.
- **Policy Management:** Store and manage policy documents.
- **User Roles:** Secure access control for Admin, Manager, Collector, and Viewer roles.
