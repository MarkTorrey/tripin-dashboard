## HeaderController ##
### Overview ###
The HeaderController widget can read and display app information, such as title, logo; can read widget pool config and display the widget/group icon. When user click the icon, this widget can open/close the cooresponding widget by calling the app container's function.

### Attributes ###
* `widgets`: String[] | String; default: no default; which widget will be controlled by this widget. "all" means all widgets in the widget pool.

* `groups`: String[] | String; default: no default; which widget group will be controlled by this widget. "all" means all groups in the widget pool.
