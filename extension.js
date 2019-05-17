
const St = imports.gi.St;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const libnm_glib = imports.gi.GIRepository.Repository.get_default().is_registered('NMClient', '1.0');
const NM = libnm_glib ? imports.gi.NMClient : imports.gi.NM;
const NetworkManager = libnm_glib ? imports.gi.NetworkManager : NM;

// i18n
const Gettext = imports.gettext;
Gettext.textdomain('reiniciar-internet');
Gettext.bindtextdomain('reiniciar-internet', imports.misc.extensionUtils.getCurrentExtension().path + "/locale");
const _ = Gettext.gettext;

let label, button;

function _hideLabel () {
    Main.uiGroup.remove_actor(label);
    label = null;
}

function _restartNetwork () {
    try {
        const client = libnm_glib ? NM.Client.new() : NM.Client.new(null);
        const primary_connection = client.get_primary_connection();
        const devices = primary_connection.get_devices();
        client.deactivate_connection(primary_connection, null);
        client.activate_connection_async(
            primary_connection.get_connection(), 
            devices[0],
            null, 
            null,
            function () {
                label.text = _('Success!!');
                _setLabelPosition();
            }
        );
    } catch (e) {
        log(e);
        label.text = _('Got error :(');        
        _setLabelPosition();
    }
    Mainloop.timeout_add_seconds(2, _hideLabel);
}

function _setLabelPosition () {
    const monitor = Main.layoutManager.primaryMonitor;

    label.set_position(monitor.x + Math.floor(monitor.width / 2 - label.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - label.height / 2));
}

function _showLabel () {
    if (!label) {
        label = new St.Label({ style_class: 'label', text: _('Restarting internet...') });
        Main.uiGroup.add_actor(label);
    }

    _setLabelPosition();

    Mainloop.timeout_add_seconds(1, _restartNetwork);
}

function init () {}

function enable () {
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    let icon = new St.Icon({ icon_name: 'network-transmit-symbolic',
                             style_class: 'system-status-icon' });
    
    button.set_child(icon);
    button.connect('button-press-event', _showLabel);
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable () {
    Main.panel._rightBox.remove_child(button);
}
