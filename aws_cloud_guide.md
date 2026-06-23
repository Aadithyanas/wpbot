# Hosting Your WhatsApp Bot on AWS (EC2 Free Tier)

Amazon Web Services (AWS) offers a 12-month free tier that includes a `t2.micro` or `t3.micro` EC2 instance. This is perfect for hosting your bot, and it allows you to choose a region like Mumbai for the lowest possible latency!

**Important Reminder:** This is only free for **12 months** from the day you created your AWS account.

Follow these steps to deploy your Nexa bot.

---

## Step 1: Create Your AWS EC2 Instance

1. Log into the [AWS Management Console](https://aws.amazon.com/console/).
2. In the top right corner, select your preferred region (e.g., **Asia Pacific (Mumbai) ap-south-1**).
3. Search for **EC2** in the top search bar and click on it.
4. Click the orange **Launch instance** button.
5. **Name:** `nexa-whatsapp-bot`.
6. **Application and OS Images (Amazon Machine Image):** 
   - Select **Ubuntu**.
   - Make sure the version says **Ubuntu Server 24.04 LTS** (or 22.04 LTS) and has the **"Free tier eligible"** badge next to it.
7. **Instance Type:** Select **t2.micro** (or `t3.micro` if t2 isn't available). It MUST have the "Free tier eligible" label.
8. **Key Pair (Login):** 
   - Click **Create new key pair**.
   - Name it `aws-nexa-key`.
   - Key pair type: **RSA**.
   - Private key file format: **.pem** (for Mac/Linux/Windows PowerShell).
   - Click **Create key pair** and **SAVE THE FILE** safely on your PC. You need it to log in.
9. **Network Settings:** 
   - Under Firewall, check **Allow SSH traffic from Anywhere**.
10. **Storage:** You can increase the size up to **30 GB** (Free tier allows up to 30GB of EBS storage).
11. Click **Launch instance** on the right side.

---

## Step 2: Connect to the Server

1. Once the instance says "Running" in your EC2 dashboard, select it and copy its **Public IPv4 address**.
2. Open **PowerShell** or **Command Prompt** on your computer.
3. AWS requires your `.pem` key to have strict permissions, but the easiest way to connect on Windows is using the built-in SSH command:
   ```bash
   ssh -i "C:\Path\To\Your\Downloaded\aws-nexa-key.pem" ubuntu@<YOUR_SERVER_PUBLIC_IP>
   ```
4. Type `yes` when asked to continue connecting.

---

## Step 3: Add Swap Space (CRITICAL FOR AWS)

Because the `t2.micro` instance only has **1GB of RAM**, Chrome will crash if it runs out of memory. We must add 2GB of "Swap Space" (virtual RAM on the hard drive). Run these exactly as written:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
To make it permanent across reboots:
```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 4: Install Node.js & Dependencies

**1. Update the server:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Install Node.js (Version 20):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**3. Install Chromium dependencies for WhatsApp:**
```bash
sudo apt install -y libxss1 libappindicator1 libindicator7 xvfb libgbm1 libasound2 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 mesa-vulkan-drivers
```

---

## Step 5: Upload Your Code

The fastest way to get your code onto the EC2 server is by cloning your GitHub repository.

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```
*(If your code is not on GitHub, you can use a program like WinSCP to upload your `ai-agent` folder using your `.pem` key).*

---

## Step 6: Setup & Run Your Bot 24/7

Navigate into your project folder (`cd ai-agent`):

**1. Install project dependencies:**
```bash
npm install
```

**2. Create your `.env` file:**
```bash
nano .env
```
Paste your variables (`SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`, etc.) into the file. 
Press `Ctrl+X`, then `Y`, then `Enter` to save and exit.

**3. Install PM2 to keep the bot alive forever:**
```bash
sudo npm install -g pm2
```

**4. Start your bot:**
```bash
pm2 start server.js --name "whatsapp-bot"
```

**5. View the QR Code to Login:**
```bash
pm2 logs whatsapp-bot
```
*Scan the QR code from your phone. Once it says "Ready", press `Ctrl+C` to exit the logs.*

**6. Ensure it starts automatically if the server reboots:**
```bash
pm2 startup
```
Copy and paste the command that it tells you to run, then run:
```bash
pm2 save
```

> [!SUCCESS]
> You are done! Nexa is now running 24/7 on AWS! Just remember to set a calendar reminder 11 months from now to terminate the instance so you don't get billed.
