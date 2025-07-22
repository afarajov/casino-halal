import json
import os
import time
import hashlib
import random
import vlc
from datetime import date
from colorama import Fore, init

init(autoreset=True)


class Casino:

    def __init__(self, users):
        self.users = users

    def error(self):
        return print('\nServer doesnt understand you, please try again.'), time.sleep(1)

    def balance_increase(self, money):
        for user in users:
            if user == current_user:
                user['balance'] += money
                break

        with open("data.json", "w") as file:
            json.dump(users, file, indent=4)

    def balance_decrease(self, money):
        for user in users:
            if user == current_user:
                user['balance'] -= money

        with open("data.json", "w") as file:
            json.dump(users, file, indent=4)

    def welcome(self):
        accept = input("\n\n\nWelcome to our casino 'Halal' !!! Do you want to raise up some money?\n... ")
        if accept.lower() == "yes":
            self.reg_or_sign()
        elif accept.lower() == "no":
            print("Okey, goodbye. See you later!!")
        else:
            self.error()
            self.welcome()

    def reg_or_sign(self):
        sign_or_create = input("\n\nDo you want to sign in or create a new account?\n... ")
        if sign_or_create.lower() == "sign in":
            self.sign_in()
        elif sign_or_create.lower() == "create":
            self.create_acc()
        else:
            self.error()
            self.reg_or_sign()

    def create_acc(self):
        print("\nAccount creation...")
        acc_name = input("\nName: ")
        acc_pass = input("\nPassword: ")

        if len(acc_pass) < 8:
            print("Password should contain at least 8 symbols, try again.")
            time.sleep(1)
            self.create_acc()

        acc_pass = hashlib.sha1(acc_pass.encode()).hexdigest()

        for user in users:
            if user['name'] == acc_name:
                print("Ups, this name is taken, try another.")
                time.sleep(1)
                self.create_acc()

        user_data = {
            'name': acc_name,
            'password': acc_pass,
            'balance': 0,
            'active': False,
            'last_deposit': ''
        }
        users.append(user_data)

        with open("data.json", "w") as file:
            json.dump(users, file, indent=4)

        print("\nAccount successfully created!")
        time.sleep(1)
        self.reg_or_sign()

    def sign_in(self):
        print("\nSigning in...")
        acc_name = input("\nName: ")
        acc_pass = input("\nPassword: ")
        acc_pass = hashlib.sha1(acc_pass.encode()).hexdigest()

        for user in users:
            if user['name'] == acc_name and user['password'] == acc_pass:
                user['active'] = True
                with open("data.json", "w") as file:
                    json.dump(users, file, indent=4)

                global current_user
                current_user = user
                self.interface()
        else:
            print('\nUser not found, try again.')
            time.sleep(1)
            self.reg_or_sign()

    def interface(self):
        print(f'''\n\n\nWelcome to our app, Mr. {current_user['name']}!!!


    Your balance: {current_user['balance']:.2f}$

    Options:
        - Games
        - Profile''')
        self.interface_choice()

    def interface_choice(self):
        choice = input("\nChoose an option:\n... ")
        if choice.lower() == "games":
            self.games()
        elif choice.lower() == "profile":
            self.profile()
        else:
            self.error()
            self.interface()

    def games(self):
        games_list = ['Cups and balls', 'Slots', 'Lucky More', 'BlackJack', 'Rulet', 'Back']

        print("\n-------GAMES--------")
        for game in games_list:
            print(game)
            print('--------------------')

        choice = input("\nChoose a game:\n... ")
        if choice.lower() == "cups and balls":
            self.cups()
            self.games()
        elif choice.lower() == "rulet":
            self.rulet()
        elif choice.lower() == "blackjack":
            self.blackjack()
        elif choice.lower() == "back":
            self.interface()
        else:
            self.error()
            self.games()

    def bets(self):
        while True:
            bet = input("\nHow much do you want to bet?:\n... $")
            if bet.isdigit():
                bet = int(bet)
                if bet <= current_user['balance']:
                    return bet
                else:
                    print("Insufficient funds, try again.")
                    time.sleep(1)
                    self.games()
            else:
                if bet.lower() == "nothing":
                    print("Okey, let's get back to games' menu.")
                    time.sleep(1)
                    self.games()
                else:
                    self.error()

    def rulet(self):
        print("\n-------𝐑𝐔𝐋𝐄𝐓-------")
        play = input("\nSpin rulet and try your luck, will you?:\n... ")
        if play.lower() == "yes":
            self.rulet_choice()
        elif play.lower() == "no":
            self.games()
        else:
            self.error()
            self.rulet()

    def rulet_choice(self):
        green_number = [0]
        black_number = [2, 4, 6, 8, 10, 11, 13, 15, 17, 19, 22, 24, 26, 28, 30, 31, 33, 35]
        red_number = [1, 3, 5, 7, 9, 12, 14, 16, 18, 20, 21, 23, 25, 27, 29, 32, 34, 36]

        print("\n------BET OPTIONS-------")
        print('''
Rulet bet options:
    - Colours
    - Numbers ''')
        print("------------------------")

        choice = input("\nChoose what will you set:\n... ")
        if choice.lower() == "colours":
            self.rulet_colours(green_number, black_number, red_number)
        elif choice.lower() == "numbers":
            self.rulet_numbers(green_number, black_number, red_number)
        else:
            self.error()
            self.rulet_choice()

    def rulet_colours(self, green_number, black_number, red_number):
        wheel_url = "https://zvukipro.com/uploads/files/2021-02/1612959435_roulette-wheel-throw-1.mp3"
        player = vlc.MediaPlayer(wheel_url)

        winning_number = random.randrange(37)
        print('----------------------------')

        choice = input("\nChoose colour (green,black,red):\n... ")
        if choice not in ('green', 'black', 'red'):
            print('\nPlease choose right colour')
            self.rulet_colours(green_number, black_number, red_number)

        money = self.bets()

        print("\nRulet is spinning...")
        player.play()
        time.sleep(9)
        print("\nThe ball hits in....")
        time.sleep(3)

        if winning_number in green_number:
            print(f'\n{Fore.GREEN}{winning_number}')
        elif winning_number in red_number:
            print(f'\n{Fore.RED}{winning_number}')
        elif winning_number in black_number:
            print(f'\n{Fore.BLACK}{winning_number}')
        time.sleep(1)

        if choice == 'green' and winning_number in green_number:
            money *= 35
            self.balance_increase(money)
            print(f"\n{Fore.GREEN}Congratulations!! You won {money * 36 / 35}$")
            time.sleep(2)
            self.rulet()
        elif choice == 'red' and winning_number in red_number:
            self.balance_increase(money)
            print(f"\n{Fore.RED}Congratulation!! You won {money * 2}$")
            time.sleep(2)
            self.rulet()
        elif choice == 'black' and winning_number in black_number:
            self.balance_increase(money)
            print(f"\n{Fore.BLACK}Congratulations!! You won {money * 2}$")
            time.sleep(2)
            self.rulet()
        else:
            self.balance_decrease(money)
            print(f"\nOops, oops, oops. Come back and try again. Your lose {money}$")
            time.sleep(2)
            self.rulet()

    def rulet_numbers(self, green_number, black_number, red_number):
        wheel_url = "https://zvukipro.com/uploads/files/2021-02/1612959435_roulette-wheel-throw-1.mp3"
        player = vlc.MediaPlayer(wheel_url)

        winning_number = random.randrange(37)
        choice_numbers = input('\nWhat number will you set?:\n... ')
        if not choice_numbers.isdigit() or (int(choice_numbers) > 36 or int(choice_numbers) < 0):
            print("Please enter a valid number.")
            self.error()
            self.rulet_numbers(green_number, black_number, red_number)
        choice_numbers = int(choice_numbers)

        money = self.bets()

        print("\nRulet is spinning...")
        player.play()
        time.sleep(9)
        print("\nThe ball hits in....")
        time.sleep(3)
        print(winning_number)
        time.sleep(1)

        if winning_number == choice_numbers:
            money *= 35
            self.balance_increase(money)
            print(f"\nCongratulations!! You won {money * 36 / 35}$")
            time.sleep(2)
            self.rulet()
        else:
            self.balance_decrease(money)
            print(f"\nOops, oops, oops. Come back and try again. Your lose {money}$")
            time.sleep(2)
            self.rulet()

    def blackjack(self):
        print("\n-------BLACKJACK-------")
        print("""
    ___________
    |A   ♠   A|
    |  ♠   ♠  |
    | ♠  ♠  ♠ |
    |  ♠   ♠  |
    |A   ♠   A|
    -----------

        """)
        play = input("Do you want to try your skill in game 'Blackjack'?:\n... ")
        if play.lower() == "yes":
            self.blackjack_game()
        elif play.lower() == "no":
            self.games()
        else:
            self.error()
            self.blackjack()

    def blackjack_game(self):
        money = self.bets()
        print("\nGame starting...")
        time.sleep(2)
        carts = {'2    ': 2, '3    ': 3, '4    ': 4, '5    ': 5, '6    ': 6, '7    ': 7,
                 '8    ': 8, '9    ': 9, '10   ': 10, "Valet": 10, "Dama ": 10, "King ": 10, "A    ": 11}
        user_hand = 0
        user_hand_list = []
        cont = "yes"

        while cont.lower() == "yes":
            card = random.choice(list(carts))
            if card == "A":
                if user_hand < 11:
                    user_hand += 11
                else:
                    user_hand += 1
                user_hand_list.append(card)
            else:
                user_hand += carts[card]
                user_hand_list.append(card)

            print("\n------YOUR HAND------")
            for i in user_hand_list:
                print(i)
                print("---------------------")
            cont = input(f"\nDo you want to continue?:\n... ")

        bot_stop = False
        bot_hand = 0
        bot_hand_list = []
        while not bot_stop:
            card = random.choice(list(carts))
            if card == "A":
                if bot_hand < 11:
                    bot_hand += 11
                else:
                    bot_hand += 1
                bot_hand_list.append(card)
            else:
                bot_hand += carts[card]
                bot_hand_list.append(card)

            if bot_hand <= 16 and bot_hand >= 14:
                chance = random.randrange(2)
                if chance == 0:
                    bot_stop = False
                else:
                    bot_stop = True
            elif bot_hand >= 17:
                bot_stop = True
            else:
                continue

        print("\n------YOUR HAND------   ------BOT'S HAND------")

        if len(user_hand_list) >= len(bot_hand_list):
            bot_count = len(bot_hand_list)

            for user_count in range(len(user_hand_list)):
                if bot_count <= 0:
                    for i in range(len(user_hand_list) - len(bot_hand_list)):
                        i += len(bot_hand_list)
                        print(user_hand_list[i])
                        print("---------------------")
                    break
                else:
                    print(f"{user_hand_list[user_count]}                     {bot_hand_list[bot_count - 1]}")
                    print("---------------------   ----------------------")
                bot_count -= 1

        else:
            user_count = len(user_hand_list)

            for bot_count in range(len(bot_hand_list)):
                if user_count <= 0:
                    for i in range(len(bot_hand_list) - len(user_hand_list)):
                        i += len(user_hand_list)
                        print(f"                          {bot_hand_list[i]}")
                        print("                        ---------------------")
                    break
                else:
                    print(f"{user_hand_list[user_count - 1]}                     {bot_hand_list[bot_count]}")
                    print("---------------------   ----------------------")
                user_count -= 1

        time.sleep(1)

        if user_hand_list == ["A    ", "A    "] and bot_hand_list == ["A    ", "A    "]:
            print("Draw! You won nothing, try again!")
            time.sleep(2)
            self.blackjack()
        elif user_hand_list == ["A    ", "A    "]:
            print(f"Congratulations, you won {money * 2}$!!!")
            self.balance_increase(money)
            time.sleep(2)
            self.blackjack()
        elif bot_hand_list == ["A    ", "A    "]:
            print(f"\nHo-ho-ho. You lose {money}$, but you can try again.")
            self.balance_decrease(money)
            self.blackjack()

        elif user_hand_list == ['7    ', '7    ', '7    ']:
            print(f"You have triple 7. Congratulations, you won {money * 3}$!!!")
            self.balance_increase(money * 2)
            time.sleep(2)
            self.blackjack()
        elif bot_hand_list == ['7    ', '7    ', '7    ']:
            print(f"\nHo-ho-ho. You lose {money}$, but you can try again.")
            self.balance_decrease(money)
            self.blackjack()

        if user_hand > 21 and bot_hand > 21:
            print("Draw! You won nothing, try again!")
            time.sleep(2)
            self.blackjack()
        elif user_hand > 21:
            print(f"\nHo-ho-ho. You lose {money}$, but you can try again.")
            self.balance_decrease(money)
            self.blackjack()

        user_difference = 21 - user_hand
        bot_difference = 21 - bot_hand
        if user_difference < bot_difference or bot_hand > 21:
            print(f"Congratulations, you won {money * 2}$!!!")
            self.balance_increase(money)
            time.sleep(2)
            self.blackjack()
        elif user_difference > bot_difference:
            print(f"Ho-ho-ho. You lose {money}$, but you can try again.")
            self.balance_decrease(money)
            time.sleep(2)
            self.blackjack()
        else:
            print("Draw! You won nothing, try again!")
            time.sleep(2)
            self.blackjack()

    def cups(self):
        print("\n--------CUPS---------")
        print('''
_____   _____   _____
|   |   |   |   |   |
|   |   |   |   |   |
        ''')

        play = input("Do you want to try your intuition in game 'Cups and balls'?:\n... ")
        if play.lower() == "yes":
            self.cups_choice()
        elif play.lower() == "no":
            self.games()
        else:
            self.error()
            self.cups()

    def cups_choice(self):
        money = self.bets()
        numbers = {1: 'I', 2: 'II', 3: 'III'}
        print('''
_____   _____   _____
|   |   |   |   |   |
|   |   |   |   |   |
                ''')
        hidden_ball = random.randint(1, 3)
        choice = int(input("In which cup, you think a ball is in(1,2,3)?\n... "))
        print(f"\nBall was in...")
        time.sleep(2)
        print(f"{numbers[hidden_ball]} cup.")
        time.sleep(1)
        if hidden_ball == choice:
            money *= 2
            self.balance_increase(money)
            print(f"\nCongratulations!! You won {money * 1.5}$")
            self.cups()
        else:
            self.balance_decrease(money)
            print(f"\nOops, oops, oops. Your intuition betrayed you. Your lose {money}$")
            time.sleep(2)
            self.cups()

    def profile(self):
        prof_list = ['Deposit money', 'Withdraw money', 'Settings', 'Log out', 'Back']
        print("\n------PROFILE-------")
        for select in prof_list:
            print(select)
            print('--------------------')

        choice = input("\nChoose an action:\n... ")
        if choice.lower() == "deposit money":
            self.deposit_money()
        elif choice.lower() == "withdraw money":
            self.withdraw_money()
        elif choice.lower() == "log out":
            self.log_out()
        elif choice.lower() == "settings":
            self.settings()
        elif choice.lower() == "back":
            self.interface()
        else:
            self.error()
            self.profile()

    def deposit_money(self):
        if current_user['last_deposit'] != date.today().isoformat():
            money = input('\nHow much do you want to deposit to your balance?:\n... $')
            if money.isdigit():
                if int(money) <= current_user['balance'] or (current_user['balance'] <= 1000 and int(money) <= 10000):
                    for user in users:
                        if user == current_user:
                            user['last_deposit'] = date.today().isoformat()
                    with open("data.json", "w") as file:
                        json.dump(users, file, indent=4)

                    money = int(money)
                    self.balance_increase(money)
                    print(f"Deposited successful. Your new balance: {current_user['balance']:.2f}$")
                    time.sleep(1)
                    self.profile()
                else:
                    print("\nYou can't deposit this much, try again !!!")
                    time.sleep(1)
                    self.deposit_money()
            else:
                self.error()
                self.deposit_money()
        else:
            print('\nYou have already deposited today, try tomorrow!!')
            time.sleep(1)
            self.profile()

    def withdraw_money(self):
        money = input('\nHow much do you want to withdraw from your balance?:\n... $')
        if money.isdigit():
            money = int(money)
            if money > current_user['balance']:
                print("Insufficient funds, try again.")
                time.sleep(1)
                self.profile()
            else:
                self.balance_decrease(money)
                print(f"Withdrawal successful. Your new balance: {current_user['balance']:.2f}$")
                time.sleep(1)
                self.profile()
        else:
            self.error()
            self.deposit_money()

    def settings(self):
        change_list = ("Change name", "Change password", "Delete account", "Back")
        print("\n---------SETTINGS---------")
        for select in change_list:
            print(select)
            print("--------------------------")
        choice = input("\nWhat do you want to change?:\n... ")
        if choice.lower() == "change name":
            self.new_name()
        elif choice.lower() == "change password":
            self.new_password(False)
        elif choice.lower() == "back":
            self.profile()
        elif choice.lower() == "delete account":
            self.delete_acc(False)
        else:
            self.error()
            self.settings()

    def delete_acc(self, checked):
        if not checked:
            check = input('\nEnter your current password:\n... ')
            if hashlib.sha1(check.encode()).hexdigest() == current_user['password']:
                self.delete_acc(True)
            else:
                print("Wrong password, try again")
                self.settings()

        confirmation = input("\nAre you sure you want to delete your account?:\n... ")
        if confirmation.lower() == 'yes':
            for user in users:
                if user == current_user:
                    users.remove(user)
            with open("data.json", "w") as file:
                json.dump(users, file, indent=4)

            print(f"\nYour account was successfuly deleted.")
            time.sleep(1)
            self.welcome()

        elif confirmation.lower() == 'no':
            print("Okey, let's get back to profile settings.")
            self.settings()
        else:
            self.error()
            self.new_password(False)

    def new_name(self):
        new_profile_name = input('\nWhich name do you want?:\n... ')
        conformation = input("\nAre you sure you want to change your name?:\n... ")
        if conformation.lower() == 'yes':
            for user in users:
                if user == current_user:
                    user['name'] = new_profile_name
            with open("data.json", "w") as file:
                json.dump(users, file, indent=4)

            print(f"\nName was successfully changed!")
            self.settings()
        elif conformation.lower() == 'no':
            print("Nothing was changed")
            self.settings()
        else:
            self.error()
            self.new_name()

    def new_password(self, checked):
        if not checked:
            check = input('\nEnter your current password:\n... ')
            if hashlib.sha1(check.encode()).hexdigest() == current_user['password']:
                self.new_password(True)
            else:
                print("Wrong password, try again")
                self.settings()

        new_profile_password = input('\nWhich password do you want?:\n... ')

        if len(new_profile_password) < 8:
            print("Password should contain at least 8 symbols, try again.")
            time.sleep(1)
            self.new_password(True)

        new_profile_password = hashlib.sha1(new_profile_password.encode()).hexdigest()

        confirmation = input("\nAre you sure you want to change your password?:\n... ")
        if confirmation.lower() == 'yes':
            for user in users:
                if user == current_user:
                    user['password'] = new_profile_password
            with open("data.json", "w") as file:
                json.dump(users, file, indent=4)

            print(f"\nPassword was successfully changed!")
            self.settings()
        elif confirmation.lower() == 'no':
            print("Nothing was changed.\n")
            self.settings()
        else:
            self.error()
            self.new_password(False)

    def log_out(self):
        for user in users:
            if user == current_user:
                user['active'] = False
        with open("data.json", "w") as file:
            json.dump(users, file, indent=4)

        print("Logging out...")
        time.sleep(3)
        self.reg_or_sign()


# get all users
try:
    if os.stat("data.json").st_size == 0:
        users = []
    else:
        with open("data.json", "r") as file:
            users = json.load(file)
except FileNotFoundError:
    users = []
except json.JSONDecodeError:
    users = []

current_user = {}

# casino starts
run = Casino(users)
for user in users:
    if user['active'] == True:
        current_user = user
        run.interface()
else:
    run.welcome()