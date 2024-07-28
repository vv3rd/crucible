// A simple Terminal.Gui example in C# - using C# 9.0 Top-level statements

using Terminal.Gui;

Application.Run<ExampleWindow> ();

System.Console.WriteLine ($"Username: {((ExampleWindow)Application.Top).usernameText.Text}");

// Before the application exits, reset Terminal.Gui for clean shutdown
Application.Shutdown ();

// Defines a top-level window with border and title
public class ExampleWindow : Window {
	public TextField usernameText;
	
	public ExampleWindow ()
	{
		Title = "Example App (Ctrl+Q to quit)";
		
		ColorScheme = new() {
			Focus = new (Color.White, Color.DarkGray),
			HotNormal = new(Color.BrightCyan, Color.Black),
			Normal = new(Color.Cyan, Color.Black) 
		};

		// Create input components and labels
		var usernameLabel = new Label () { 
			Y = 2,
			Text = "Username:",
		};

		usernameText = new TextField ("") {
			// Position text field adjacent to the label
			X = Pos.Right (usernameLabel) + 1,
			Y = Pos.Top (usernameLabel),
			// Fill remaining horizontal space
			Width = Dim.Fill (),
		};

		var passwordLabel = new Label () {
			Text = "Password:",
			X = Pos.Left (usernameLabel),
			Y = Pos.Bottom (usernameLabel) + 1
		};

		var passwordText = new TextField ("") {
			Secret = true,
			// align with the text box above
			X = Pos.Left (usernameText),
			Y = Pos.Top (passwordLabel),
			Width = Dim.Fill (),
		};

		// Create login button
		var btnLogin = new Button () {
			Text = "Login",
			Y = Pos.Bottom(passwordLabel) + 1,
			// center the login button horizontally
			X = Pos.Center (),
			IsDefault = true,
		};

		// When login button is clicked display a message popup
		btnLogin.Clicked += () => {
			if (usernameText.Text == "admin" && passwordText.Text == "password") {
				MessageBox.Query ("Logging In", "Login Successful", "Ok");
				Application.RequestStop ();
			} else {
				MessageBox.ErrorQuery ("Logging In", "Incorrect username or password", "Ok");
			}
		};

		// Add the views to the Window
		Add (usernameLabel, usernameText, passwordLabel, passwordText, btnLogin);
	}
}
