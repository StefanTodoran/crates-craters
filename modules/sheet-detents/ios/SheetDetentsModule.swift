import ExpoModulesCore
import UIKit

/// React Native's Modal can present a page sheet but can't set its detents. Calling
/// prepareNextSheet just before a Modal opens makes that sheet open at half height
/// (draggable to full), with a clear background so the system sheet material (Liquid
/// Glass on iOS 26) shows. Detents have to be set before presentation, or the sheet
/// opens at full height and then snaps down.
public class SheetDetentsModule: Module {
  /// Set from JS, consumed by the next React Native modal presented as a sheet.
  static var pendingClearBackground: Bool?

  public func definition() -> ModuleDefinition {
    Name("SheetDetents")

    OnCreate {
      UIViewController.installSheetDetentsHook()
    }

    // Synchronous, so it runs before the render that opens the Modal is mounted.
    Function("prepareNextSheet") { (clearBackground: Bool) in
      Self.pendingClearBackground = clearBackground
    }
  }

  /// Returns whether it configured the sheet.
  static func configure(_ presented: UIViewController) -> Bool {
    guard let clearBackground = pendingClearBackground,
          NSStringFromClass(type(of: presented)).contains("ModalHostViewController"),
          let sheet = presented.sheetPresentationController else { return false }
    pendingClearBackground = nil
    sheet.detents = [.medium(), .large()]
    sheet.selectedDetentIdentifier = .medium
    sheet.prefersGrabberVisible = true
    if clearBackground {
      presented.view.backgroundColor = .clear
    }
    return true
  }

  /// React Native's modal sets isModalInPresentation, so UIKit never dismisses it on its
  /// own: a swipe down only asks React Native to close it (onRequestClose). Taps on the
  /// dimmed area above the sheet do nothing, so this makes them ask the same way.
  static func addTapOutsideToClose(_ presented: UIViewController) {
    guard let controller = presented.presentationController, let container = controller.containerView else { return }
    let tap = OutsideTapRecognizer(target: OutsideTapRecognizer.self, action: #selector(OutsideTapRecognizer.handle(_:)))
    tap.presented = presented
    tap.cancelsTouchesInView = false
    tap.delegate = tap
    container.addGestureRecognizer(tap)
  }
}

private class OutsideTapRecognizer: UITapGestureRecognizer, UIGestureRecognizerDelegate {
  weak var presented: UIViewController?

  // The sheet's dimming view has its own tap recognizer; recognize alongside it.
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                         shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    true
  }

  @objc static func handle(_ tap: OutsideTapRecognizer) {
    guard let presented = tap.presented, let view = presented.view, let container = tap.view,
          let controller = presented.presentationController else { return }
    let sheetFrame = view.convert(view.bounds, to: container)
    if sheetFrame.contains(tap.location(in: container)) { return }
    controller.delegate?.presentationControllerDidAttemptToDismiss?(controller)
  }
}

extension UIViewController {
  private static var hookInstalled = false

  static func installSheetDetentsHook() {
    guard !hookInstalled,
          let original = class_getInstanceMethod(UIViewController.self, #selector(present(_:animated:completion:))),
          let replacement = class_getInstanceMethod(UIViewController.self, #selector(sheetDetents_present(_:animated:completion:)))
    else { return }
    hookInstalled = true
    method_exchangeImplementations(original, replacement)
  }

  @objc private func sheetDetents_present(_ controller: UIViewController, animated: Bool, completion: (() -> Void)?) {
    let configured = SheetDetentsModule.configure(controller)
    // Implementations are swapped, so this calls UIKit's original present.
    sheetDetents_present(controller, animated: animated) {
      if configured { SheetDetentsModule.addTapOutsideToClose(controller) }
      completion?()
    }
  }
}
